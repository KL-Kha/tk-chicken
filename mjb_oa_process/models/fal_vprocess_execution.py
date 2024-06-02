# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from odoo.exceptions import UserError

class fal_vprocess_execution(models.Model):
    _inherit = ['mail.thread', 'mail.activity.mixin']

    _name = "fal.vprocess.execution"
    _description = "Execution"

    name = fields.Char("Name", default="Execution")
    active = fields.Boolean("Active", default=True)
    
    finished = fields.Boolean("Finished", default=False, track_visibility='onchange')
    cancelled = fields.Boolean("Cancelled", default=False, track_visibility='onchange')
    
    process_id = fields.Many2one('fal.vprocess', 'Process', required=True)
    process_model = fields.Char(string='Process model', related='process_id.model_id.model')
    step_id = fields.Many2one('fal.vprocess.step', 'Step', required=True, track_visibility='onchange')
    step_sequence = fields.Integer(string='Step sequence', related='step_id.sequence')
    target = fields.Integer("Target", default=0)
    
    previous_step_id = fields.Many2one('fal.vprocess.step', 'Previous Step', required=False)
    last_action = fields.Char("Last action", default="")

    def _valid_field_parameter(self, field, name):
        return name == 'track_visibility' or super()._valid_field_parameter(field, name)
