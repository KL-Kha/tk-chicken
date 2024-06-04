# -*- coding: utf-8 -*-

from odoo import fields, models, api


class PriceList(models.Model):
    _inherit = "product.pricelist"

    display_product_price = fields.Selection([('system_setting', 'As per Setting in Website/Configuration'),
                                              ('total_excluded', 'Total Excluded'),
                                              ('total_included', 'Total Included')],
                                             string="Display Product Prices on Website",
                                             help='Display Product Prices on Website',
                                             default='system_setting')

    enable_price_table = fields.Boolean('Price Table?',
                                        help='Display Price table for more than one minimum quantity rule')
