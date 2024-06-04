# -*- coding: utf-8 -*-

import datetime
from collections import Counter

from odoo import models, fields, api, _
from odoo.osv import expression


class WebsiteSnippetFilter(models.Model):
    _inherit = 'website.snippet.filter'

    field_names = fields.Char(default='id')

    def _get_products_discount_products(self, website, limit, domain, context):
        products = []
        price_list = website._get_current_pricelist()
        product_template_snippet = context.get('product_template_snippet', False)
        pl_items = price_list.item_ids.filtered(lambda r: (
                    (not r.date_start or r.date_start <= datetime.datetime.today()) and (not r.date_end or r.date_end > datetime.datetime.today())))
        products_ids = []
        if pl_items.filtered(lambda r: r.applied_on in ['3_global']):
            if product_template_snippet:
                products = self.env['product.template'].with_context(display_default_code=False, add2cart_rerender=True).search(domain, limit=limit)
            else:
                products = self.env['product.product'].with_context(display_default_code=False, add2cart_rerender=True).search(domain, limit=limit)
        else:
            for line in pl_items:
                if line.applied_on in ['1_product']:
                    if product_template_snippet:
                        products_ids.extend(line.product_id.ids)
                    else:
                        products_ids.extend(line.product_tmpl_id.product_variant_ids.ids)
                elif line.applied_on in ['0_product_variant']:
                    products_ids.extend(line.product_id.ids)
                    # append line.product_id
            products_ids = list(set(products_ids))
        if products_ids:
            domain = expression.AND([domain, [('id', 'in', products_ids)]])
            if product_template_snippet:
                products = self.env['product.template'].with_context(display_default_code=False, add2cart_rerender=True).search(domain, limit=limit)
            else:
                products = self.env['product.product'].with_context(display_default_code=False, add2cart_rerender=True).search(domain, limit=limit)
        return products

    def _get_products_latest_viewed_product_template(self, website, limit, domain, context):
        products = self.env['product.product']
        visitor = self.env['website.visitor']._get_visitor_from_request()
        if visitor:
            excluded_products = website.sale_get_order().order_line.product_id.ids
            tracked_products = self.env['website.track'].sudo()._read_group(
                [('visitor_id', '=', visitor.id), ('product_id', '!=', False), ('product_id.website_published', '=', True), ('product_id', 'not in', excluded_products)],
                ['product_id'], limit=limit, order='visit_datetime:max DESC')
            products_ids = [product.id for [product] in tracked_products]
            if products_ids:
                domain = expression.AND([
                    domain,
                    [('id', 'in', products_ids)],
                ])
                products = self.env['product.product'].with_context(display_default_code=False, add2cart_rerender=True).search(domain, limit=limit)
        products = products.mapped('product_tmpl_id')
        return products

    def _get_products_latest_sold_product_template(self, website, limit, domain, context):
        products = self.env['product.product']
        sale_orders = self.env['sale.order'].sudo().search([
            ('website_id', '=', website.id),
            ('state', 'in', ('sale', 'done')),
        ], limit=30, order='date_order DESC')
        if sale_orders:
            sold_products = [p.product_id.id for p in sale_orders.order_line]
            products_ids = [id for id, _ in Counter(sold_products).most_common()]
            if products_ids:
                domain = expression.AND([
                    domain,
                    [('id', 'in', products_ids)],
                ])
                products = self.env['product.product'].with_context(display_default_code=False).search(domain)
                products = products.sorted(key=lambda p: products_ids.index(p.id))[:limit]
        products = products.mapped('product_tmpl_id')
        return products

    def _filter_records_to_values(self, records, is_sample=False):
        res_products = super()._filter_records_to_values(records, is_sample)
        if self.model_name == 'product.template':
            if self.env.context.get('add2cart'):
                res_products = [{**d, 'add2cart': True} for d in res_products]
            if self.env.context.get('compare'):
                res_products = [{**d, 'compare': True} for d in res_products]
            if self.env.context.get('wishlist'):
                res_products = [{**d, 'wishlist': True} for d in res_products]
            if self.env.context.get('rating'):
                res_products = [{**d, 'rating': True} for d in res_products]
            if self.env.context.get('quickview'):
                res_products = [{**d, 'quickview': True} for d in res_products]
            if self.env.context.get('color_swatches'):
                res_products = [{**d, 'color_swatches': True} for d in res_products]
            if self.env.context.get('image_flipper'):
                res_products = [{**d, 'image_flipper': True} for d in res_products]
            if self.env.context.get('product_label'):
                res_products = [{**d, 'product_label': True} for d in res_products]
        if self.model_name in ['product.public.category', 'product.brand']:
            if self.env.context.get('count'):
                res_products = [{**d, 'count': True} for d in res_products]
        return res_products
