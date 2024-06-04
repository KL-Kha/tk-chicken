# -*- coding: utf-8 -*-
import logging

from odoo import api, fields, models, _

_logger = logging.getLogger(__name__)


class ProductRibbonEPT(models.Model):
    _inherit = "product.ribbon"

    html = fields.Html(string='Ribbon html', translate=True, sanitize=False, default='')
    products_count = fields.Integer('Product Count', compute='_compute_products_count',
                                    help='Number of product counts that configured to label')
    sequence = fields.Integer('Sequence', index=True, default=10)
    product_ids = fields.One2many('product.template', 'website_ribbon_id', 'Products')
    ribbon_style = fields.Selection([('o_ribbon_', 'Slanted'),
                                     ('o_tag_', 'Tag'),
                                     ('o_product_label_style_1_', 'Vega Tag'),
                                     ('o_product_label_style_2_', 'Vega Square Shadow'),
                                     ('o_product_label_style_3_', 'Vega Edge 1'),
                                     ('o_product_label_style_4_', 'Vega Edge 2'),
                                     ('o_product_label_style_5_', 'Vega Round')], 'Ribbon Style',
                                    help="Product Ribbon styles")
    ribbon_position = fields.Selection([('left', 'Left'), ('right', 'Right')], 'Ribbon Position', help="Product Ribbon position")

    @api.onchange('ribbon_style', 'ribbon_position')
    def onchange_ribbon(self):
        if self.ribbon_style:
            self.html_class = f"{self.ribbon_style}{self.ribbon_position}"

    def write(self, vals):
        self.clear_caches()
        if vals.get('ribbon_style', False) or vals.get('ribbon_position', False):
            ribbon_position = vals.get('ribbon_position') if vals.get('ribbon_position', False) else self.ribbon_position
            ribbon_style = vals.get('ribbon_style') if vals.get('ribbon_style', False) else self.ribbon_style
            html_class = f"{ribbon_style}{ribbon_position}"
            vals.update({'html_class': html_class})
        res = super(ProductRibbonEPT, self).write(vals)
        return res

    @api.depends('product_ids')
    def _compute_products_count(self):
        for label in self:
            label.products_count = len(label.product_ids)

    def set_label_wizard(self):
        action = {
            'type': 'ir.actions.act_window',
            'res_model': 'product.label.config',
            'name': "Product Configuration",
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_label_id': self.id},
        }
        return action


