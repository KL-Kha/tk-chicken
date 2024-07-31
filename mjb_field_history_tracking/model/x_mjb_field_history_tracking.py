from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from odoo.http import request
from werkzeug.urls import url_parse
from odoo import Command
from markupsafe import Markup

class XMjbFieldHistoryTracking(models.Model):
    _name = "x_mjb_field_history_tracking"
    _description = "x_mjb_field_history_tracking"
    _rec_name = "x_mjb_track_model"
    _order = "id desc"

    x_mjb_is_tracking = fields.Boolean(string="Tracking?")
    x_mjb_track_model = fields.Many2one('ir.model', string="Model")
    x_mjb_track_field = fields.Many2many('ir.model.fields', string="Fields")
    automation_id = fields.Many2one('base.automation', string="Automated Action")

    @api.onchange('x_mjb_track_model')
    def _onchange_x_mjb_track_model(self):
        self.x_mjb_track_field = [(6, 0, [])]

    def _create_update_automated_action(self):
        BaseAutomation = self.env['base.automation']
        for rec in self:
            rec.automation_id.unlink()
            if rec.x_mjb_is_tracking:
                automation_id = BaseAutomation.create({
                    'name': '[MJB] Auto Log - Model: ' + rec.x_mjb_track_model.name,
                    'model_id': rec.x_mjb_track_model.id,
                    'trigger': 'on_create_or_write',
                    'trigger_field_ids': [(6, 0, rec.x_mjb_track_field.ids)],
                    'active': True,
                })

                action = self.env["ir.actions.server"].create({
                    "name": "[MJB] Auto Log Tracking Actions - Model: "+ rec.x_mjb_track_model.name,
                    "base_automation_id": automation_id.id,
                    "state": "code",
                    "code": """
env['x_mjb_field_history_tracking']._check_update(records)                    
""",
                    "model_id": rec.x_mjb_track_model.id,
                })

                automation_id.write({"action_server_ids": [Command.link(action.id)]})
                
                rec._write({
                    'automation_id': automation_id.id
                })
                
    @api.model
    def create(self, vals):
        res = super(XMjbFieldHistoryTracking, self).create(vals)
        res._create_update_automated_action()
        return res

    def write(self, vals):
        res = super(XMjbFieldHistoryTracking, self).write(vals)
        self._create_update_automated_action()
        return res

    def unlink(self):
        for rec in self:
            rec.automation_id.unlink()
        return super(XMjbFieldHistoryTracking, self).unlink()

    def _check_update(self, records):
        IrModelFields = self.env['ir.model.fields']
        IrModel = self.env['ir.model']
        for record in records:
            if self.env.context.get('old_values'):
                if record.env.context.get('__action_done'):
                    actions = record.env.context.get('__action_done')
                    for key, value in actions.items():
                        automated = key.id
                        automated_id = self.env['base.automation'].browse(automated)
                else:
                    automated_id = self.env['base.automation'] 
                oldValues = self.env.context['old_values'][record.id]

                context_model = self._context['active_model']
                context_active_id = self._context['active_id']
                
                context_record_change = self.env[context_model].search([('id','=',context_active_id)])
                
                for k in oldValues:
                    model_id = IrModel.search([
                        ('model', '=', str(context_model)),
                    ])
                    fields_id = IrModelFields.search([
                        ('model_id', '=', model_id.id),
                        ('name', '=', k),
                    ])                        
                    if fields_id.ttype not in ['many2many', 'one2many']:
                        if fields_id.id in automated_id.trigger_field_ids.ids:
                            if fields_id.ttype == 'binary':
                                if fields_id.name =='x_file_specifications':
                                    field_binary_to_name = 'x_specifications_filename'
                                    old_value = self.env.context['old_values'][record.id].get(field_binary_to_name)
                                else:
                                    field_binary_to_name = fields_id.name + '_filename'
                                    old_value = self.env.context['old_values'][record.id].get(field_binary_to_name)

                                # test=self.env.context['old_values'][record.id]
                                new_value = context_record_change[field_binary_to_name]
                            else:
                                old_value = oldValues[k]
                                new_value = record[k]
                                if fields_id.ttype in ['many2one', 'many2one_reference']:
                                    old_value = self.env[fields_id.relation].browse(oldValues[k][0])
                                    
                                    old_value = old_value.name
                                    new_value = record[k].name
                            
                            args_param = request.params.get('args')
                            # Check if 'args' is a list and not empty
                            if isinstance(args_param, list) and len(args_param) > 0:
                                # Extract the first element of the 'args' list
                                first_arg_list = args_param[0]

                                # Check if the first element is a list and not empty
                                if isinstance(first_arg_list, list) and len(first_arg_list) > 0:
                                    # Get the ID from the first element of the first list
                                    main_record_id = first_arg_list[0]
                            
                            #get full path url (POST)
                            base_url = request.httprequest.full_path
                            #plit get model name
                            split_url = base_url.split('call_kw/')[1].split('/')[0] if 'call_kw/' in base_url else ''
                            post_record_id = self.env[split_url].search([('id','=',main_record_id)])

                            list_current_record = [field_not_change for field_not_change in automated_id.trigger_field_ids if field_not_change != fields_id]

                            bullet_list = ""
                            for item in list_current_record:
                                field_description_id = IrModelFields.search([
                                    ('model_id', '=', model_id.id),
                                    ('name', '=', item.name),
                                ]) 

                                if item.ttype == 'binary':
                                    field_binary_to_name = item.name + '_filename'
                                    bullet_list += f"<li>{field_description_id.field_description}: {context_record_change[field_binary_to_name]}</li>"
                                else:
                                    if hasattr(context_record_change[item.name], 'display_name'):
                                        bullet_list += f"<li>{field_description_id.field_description}: {str(context_record_change[item.name].display_name)}</li>"
                                    elif hasattr(context_record_change[item.name], 'name'):
                                        bullet_list += f"<li>{field_description_id.field_description}: {context_record_change[item.name].name}</li>"
                                    else:
                                        bullet_list += f"<li>{field_description_id.field_description}: {str(context_record_change[item.name])}</li>"
                            if model_id.model == split_url:
                                message_post_body = Markup("<b>%s has been update:</b><br><ul><li>%s : %s <i class='o-mail-Message-trackingSeparator fa fa-long-arrow-right mx-1 text-600'/> %s</li>%s" %(split_url,fields_id.field_description , old_value, new_value, bullet_list))
                                post_record_id.message_post(
                                    body=message_post_body
                                )
                            else:
                                message_post_body = Markup("<b>%s has been updated:</b><br><ul><li>%s : %s <i class='o-mail-Message-trackingSeparator fa fa-long-arrow-right mx-1 text-600'/> %s</li>%s" %(model_id.model,fields_id.field_description , old_value, new_value, bullet_list))
                                post_record_id.message_post(
                                    body=message_post_body
                                )