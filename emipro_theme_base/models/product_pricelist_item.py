# -*- coding: utf-8 -*-

from odoo import fields, models, api


class PriceListItem(models.Model):
    _inherit = "product.pricelist.item"

    offer_msg = fields.Text(string="Offer Message", translate=True, help="To set the message in the product offer timer.", size=35)
    is_display_timer = fields.Boolean(string='Show Offer Timer', help="It shows the offer timer on the product page.")
