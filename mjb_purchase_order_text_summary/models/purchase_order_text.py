from odoo import fields, models, api, _
from ast import literal_eval
from odoo.exceptions import UserError


class PurchaseOrderSummarySetting(models.TransientModel):
    _inherit = 'res.config.settings'

    num_fields_purchase_order = fields.Many2many('ir.model.fields', string="Purchase Order Line Fields",
                                                 domain="[('model_id','=','purchase.order.line'),('ttype','in',['integer','float','monetary'])]",
                                                 compute="_compute_num_fields_purchase_order",
                                                 inverse="_inverse_num_fields_purchase_order_str")
    num_fields_purchase_order_str = fields.Char(string="Purchase Order Line Fields in String",
                                                config_parameter='purchase.num_fields_purchase_order')

    @api.depends('num_fields_purchase_order_str')
    def _compute_num_fields_purchase_order(self):
        """ As config_parameters does not accept m2m field,
            we get the fields back from the Char config field, to ease the configuration in config panel """
        for setting in self:
            if setting.num_fields_purchase_order_str:
                names = setting.num_fields_purchase_order_str.split(',')
                fields = self.env['ir.model.fields'].search(
                    [('name', 'in', names), ('model', '=', 'purchase.order.line')])
                setting.num_fields_purchase_order = self.env['ir.model.fields'].search([('id', 'in', fields.ids)])
            else:
                setting.num_fields_purchase_order = None

    def _inverse_num_fields_purchase_order_str(self):
        """ As config_parameters does not accept m2m field,
            we store the fields with a comma separated string into a Char config field """
        for setting in self:
            if setting.num_fields_purchase_order:
                setting.num_fields_purchase_order_str = ','.join(setting.num_fields_purchase_order.mapped('name'))
            else:
                setting.num_fields_purchase_order_str = ''


class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    po_quantities_summary = fields.Html(string='Quantities Summary', default=False)
