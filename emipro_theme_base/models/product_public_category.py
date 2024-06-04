# -*- coding: utf-8 -*-

from odoo import models, fields
from odoo.http import request
from odoo.tools.translate import html_translate


class ProductPublicCategory(models.Model):
    _inherit = "product.public.category"

    is_category_page = fields.Boolean(string='Allow Category Page',
                                      help="It will set the separate page for this category")
    category_page = fields.Many2one("website.page", string="Select Page",
                                    help="Select the page which you want to set for this category.")
    icon = fields.Binary('Category Icon')
    menu_label_id = fields.Many2one('menu.label', string='Menu Label', help='Select a menu label for this category')
    footer_description = fields.Html('Footer Description', sanitize_overridable=True, sanitize_attributes=False,
                                     translate=html_translate, sanitize_form=False)

    def get_product_count(self):
        domain = request.website.sale_product_domain()
        domain.append(('public_categ_ids', 'child_of', self.id))
        count = request.env['product.template'].search_count(domain)
        return count
