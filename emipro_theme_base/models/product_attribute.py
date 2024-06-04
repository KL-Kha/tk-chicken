# -*- coding: utf-8 -*-

from odoo import fields, models


class ProductAttribute(models.Model):
    _inherit = "product.attribute"

    icon_style = fields.Selection([('round', "Round"), ('square', "Square")], string="Icon Style",
                                  default='round', help="Here, Icon size is 40*40")
