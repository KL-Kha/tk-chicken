from odoo import models,fields

class res_groups(models.Model):
    _inherit = "res.groups"

    mjb_injector = fields.Many2many('mjb.injector', 'groups_group_injector', 'group_id', 'group_injector_id', string='MJB Injector JS/XML/CSS' )
