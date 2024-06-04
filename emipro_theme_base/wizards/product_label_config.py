"""
@author: Emipro Technologies Pvt. Ltd.
"""
from odoo import models, fields, api


class ProductLabelConfig(models.TransientModel):
    _name = 'product.label.config'
    _description = "Product Label Configuration Wizard"

    label_id = fields.Many2one('product.ribbon', string="Label")
    product_ids = fields.Many2many('product.template')

    @api.onchange('label_id')
    def onchange_label_id(self):
        self.write({
            'product_ids': [(6, 0, self.label_id.product_ids.ids)]
        })

    def config_label_product(self):
        if self.label_id:
            self.label_id.product_ids.write({'website_ribbon_id': False})
            self.product_ids.write({'website_ribbon_id': self.label_id})
