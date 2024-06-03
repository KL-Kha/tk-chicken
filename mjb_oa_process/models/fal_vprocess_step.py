# -*- coding: utf-8 -*-
from odoo import fields, models, api
from odoo.exceptions import UserError

class fal_vprocess_step(models.Model):
    _inherit = ['mail.thread', 'mail.activity.mixin']
    
    _name = "fal.vprocess.step"
    _description = "Step"

    name = fields.Char("Name", default="Step")
    active = fields.Boolean("Active", default=True)
    
    auto_confirm_no_conditions = fields.Boolean("Auto confirm if no conditions", default=False)
    allow_anyone_no_conditions = fields.Boolean("Allow anyone if no conditions", default=True)
    auto_confirm_no_active_rules = fields.Boolean("Auto confirm if no active rules", default=False)
    
    disable_edit = fields.Boolean("Disable Edition", default=True)
    disable_actions = fields.Boolean("Disable Actions", default=True)
    allowed_actions_list = fields.Char("Allowed actions names", default="")
    
    enable_email = fields.Boolean("Send email to authorized users", default=False)
    enable_activity = fields.Boolean("Set activity to authorized users", default=False)
    #activity_text = fields.Char("Activity text", default="Please review $MODEL")
    
    #activity_type_id = fields.Many2one('mail.activity.type', 'Activity Type', required=False)
    #email_template_id = fields.Many2one('mail.template', 'Email Template', required=False)
    
    buttons_back = fields.Boolean("Allow back button", default=True)
    buttons_reset = fields.Boolean("Allow reset button", default=True)
    
    sequence = fields.Integer("Sequence", default=0)
    process_id = fields.Many2one('fal.vprocess', 'Process', auto_join=True)
    
    rule_ids = fields.One2many("fal.vprocess.rule", 'step_id', 'Rules', ondelete='cascade')
    
    action_string_confirm = fields.Char("Action on confirm", default="")
    action_string_cancel = fields.Char("Action on cancel", default="")
    action_string_back = fields.Char("Action on back", default="")
    action_string_reset = fields.Char("Action on reset", default="")
    
    field_string_confirm = fields.Char("Change field on confirm", default="")
    field_string_cancel = fields.Char("Change field on cancel", default="")
    field_string_back = fields.Char("Change field on back", default="")
    field_string_reset = fields.Char("Change field on reset", default="")
    
    def _valid_field_parameter(self, field, name):
        return name == 'ondelete' or super()._valid_field_parameter(field, name)
