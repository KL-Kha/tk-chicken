"""
@author: Emipro Technologies Pvt. Ltd.
"""
from odoo import models, fields, api


class ProductBrandConfig(models.TransientModel):
    _name = 'product.brand.config'
    _description = "Product Brand Configuration Wizard"

    brand_id = fields.Many2one('product.brand', string="Brand")
    product_ids = fields.Many2many('product.template')

    @api.onchange('brand_id')
    def onchange_brand_id(self):
        self.write({
            'product_ids': [(6, 0, self.brand_id.product_ids.ids)]
        })

    def config_brand_product(self):
        if self.brand_id:
            self.brand_id.product_ids.write({'product_brand_id': False})
            self.product_ids.write({'product_brand_id': self.brand_id})
