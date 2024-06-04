# -*- coding: utf-8 -*-

import logging

from odoo import models, fields

_logger = logging.getLogger(__name__)


class IrAttachment(models.Model):
    _inherit = 'ir.attachment'

    is_product_document = fields.Boolean('Product Document')
    website_url = fields.Char(string="Website URL", related='local_url', deprecated=True, readonly=False)

    def config_product_document(self):
        products = self.env['product.template'].search([('document_ids.id', '=', self.id)])
        action = {
            'type': 'ir.actions.act_window',
            'res_model': 'product.document.config',
            'name': "Configure to Products",
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_document_id': self.id, 'default_product_ids': products.ids,
                        'default_temp_product_ids': products.ids},
        }
        return action
