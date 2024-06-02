# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from odoo.exceptions import UserError

class fal_vprocess(models.Model):
    _inherit = ['mail.thread', 'mail.activity.mixin']
    #_order = "sequence"

    _name = "fal.vprocess"
    _description = "Validation Process"

    name = fields.Char("Name", default="Process")
    active = fields.Boolean("Active", default=True)
    
    # @TODO this field is useless as we put the option on the step instead
    disable_edit = fields.Boolean("Disable Edition", default=True)
    
    
    disable_actions = fields.Boolean("Disable Actions", default=True)
    allowed_actions_list = fields.Char("Allowed actions names", default="")
    
    allow_restart_after_approved = fields.Boolean("Allow restart after approved if triggered", default=False)
    allow_restart_after_cancelled = fields.Boolean("Allow restart after cancelled if triggered", default=False)
    
    log_message_to_object = fields.Boolean("Log messages to object", default=False)
    process_activity_type_id = fields.Many2one('mail.activity.type', 'Activity type', required=False)
    
    model_id = fields.Many2one('ir.model', string='Model')
    model_name = fields.Char(string='Model name', related='model_id.model')
    
    trigger_id = fields.Many2one('ir.filters', 'Trigger', required=True)
    trigger_domain = fields.Text(string='Trigger domain', compute='_compute_trigger_domain')
    
    filter_id = fields.Many2one('ir.filters', 'Process-wide filter', required=True)
    filter_domain = fields.Text(string='Process-wide domain', compute='_compute_filter_domain')
    
    step_ids = fields.One2many("fal.vprocess.step", 'process_id', 'Steps', ondelete='cascade')

    def _valid_field_parameter(self, field, name):
        return name == 'ondelete' or super()._valid_field_parameter(field, name)

    #Change related field into compute (Migration V13 - V15), ir_filter changed into single quote when saved in Odoo15
    #JSON.parse() string format must on double quote else error
    #Compute domain to reformat related field
    def _compute_trigger_domain(self):
        for record in self:
            if record.trigger_id and record.trigger_id.domain:
                record.trigger_domain = record.trigger_id.domain.replace("'", '"')
                record.trigger_domain = record.trigger_domain.replace("(", "[")
                record.trigger_domain = record.trigger_domain.replace(")", "]")
            else:
                record.trigger_domain = False

    def _compute_filter_domain(self):
        for record in self:
            if record.filter_id and record.filter_id.domain:
                record.filter_domain = record.filter_id.domain.replace("'", '"')
                record.filter_domain = record.filter_domain.replace("(", "[")
                record.filter_domain = record.filter_domain.replace(")", "]")
            else:
                record.filter_domain = False
