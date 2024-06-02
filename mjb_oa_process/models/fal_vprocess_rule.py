# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from odoo.exceptions import UserError

class fal_vprocess_rule(models.Model):
    _inherit = ['mail.thread', 'mail.activity.mixin']
    
    _name = "fal.vprocess.rule"
    _description = "Rule"

    name = fields.Char("Name", default="Rule")
    active = fields.Boolean("Active", default=True)
    sequence = fields.Integer("Sequence", default=0)
    
    step_id = fields.Many2one('fal.vprocess.step', 'Step', auto_join=True)
    user_ids = fields.Many2many('res.users')
    user_filter_id = fields.Many2one('ir.filters', 'User Filter', required=False)
    user_filter_domain = fields.Text(string='User Filter Domain', compute='_compute_user_filter_domain')
    
    custom_user_domain = fields.Text(string='Custom user domain')
    
    filter_id = fields.Many2one('ir.filters', 'Applies on', required=True)
    domain = fields.Text(string='Domain', compute='_compute_filter_domain')

    #Change related field into compute (Migration V13 - V15), ir_filter changed into single quote when saved in Odoo15
    #JSON.parse() string format must on double quote else error
    #Compute domain to reformat related field
    def _compute_user_filter_domain(self):
        for record in self:
            if record.user_filter_id and record.user_filter_id.domain:
                record.user_filter_domain = record.user_filter_id.domain.replace("'", '"')
                record.user_filter_domain = record.user_filter_domain.replace("(", "[")
                record.user_filter_domain = record.user_filter_domain.replace(")", "]")
            else:
                record.user_filter_domain = False

    def _compute_filter_domain(self):
        for record in self:
            if record.filter_id and record.filter_id.domain:
                record.domain = record.filter_id.domain.replace("'", '"')
                record.domain = record.domain.replace("(", "[")
                record.domain = record.domain.replace(")", "]")
            else:
                record.domain = False
