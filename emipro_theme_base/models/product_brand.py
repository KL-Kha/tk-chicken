# -*- coding: utf-8 -*-

from odoo import api, fields, models
from odoo.http import request
from odoo.tools.translate import html_translate


class ProductBrandEpt(models.Model):
    _name = 'product.brand'
    _inherit = ['website.published.multi.mixin', 'image.mixin']
    _description = 'Product Brand'
    _order = 'sequence, name, id'

    name = fields.Char('Brand Name', required=True, translate=True)
    description = fields.Html('Description', sanitize_overridable=True, sanitize_attributes=False,
                              translate=html_translate, sanitize_form=False)
    website_id = fields.Many2one("website", string="Website")
    product_ids = fields.One2many('product.template', 'product_brand_id', string="Products", readonly=True)
    products_count = fields.Integer('Product Count', compute='_compute_products_count',
                                    help='Number of product counts that configured to brand')
    sequence = fields.Integer('Sequence', index=True, default=10)
    footer_description = fields.Html('Footer Description', sanitize_overridable=True, sanitize_attributes=False,
                                     translate=html_translate, sanitize_form=False)

    @api.depends('product_ids')
    def _compute_products_count(self):
        for brand in self:
            brand.products_count = len(brand.product_ids)

    def set_brand_wizard(self):
        action = {
            'type': 'ir.actions.act_window',
            'res_model': 'product.brand.config',
            'name': "Product Configuration",
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_brand_id': self.id},
        }
        return action

    def get_product_count(self):
        domain = request.website.sale_product_domain()
        domain.append(('product_brand_id', '=', self.id))
        count = request.env['product.template'].search_count(domain)
        return count
