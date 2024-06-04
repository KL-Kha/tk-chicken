# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request
from odoo.tools import lazy
from odoo.osv import expression


class ProductTemplate(models.Model):
    _inherit = "product.template"

    product_brand_id = fields.Many2one('product.brand', string='Brand', help='Brand for this product')
    document_ids = fields.Many2many('ir.attachment', 'product_template_ir_attachment_ept_rel', string="Documents",
                                    domain="[('mimetype', 'not in', ('application/javascript','text/css'))]")
    tab_line_ids = fields.One2many('product.tab.line', 'product_id', 'Product Tabs',
                                   compute="_get_product_tabs",
                                   inverse="_set_product_tabs", help="Set the product tabs")
    free_qty = fields.Float(
        'Free To Use Quantity', compute='_compute_quantities', search='_search_free_qty',
        compute_sudo=False, digits='Product Unit of Measure')

    @api.depends(
        'product_variant_ids.free_qty',
        'product_variant_ids.virtual_available',
        'product_variant_ids.incoming_qty',
        'product_variant_ids.outgoing_qty',
        'product_variant_ids.free_qty',
    )
    def _compute_quantities(self):
        super(ProductTemplate, self)._compute_quantities()
        res = self._compute_quantities_dict()
        for template in self:
            template.free_qty = res[template.id]['free_qty']

    def _compute_quantities_dict(self):
        prod_available = super(ProductTemplate, self)._compute_quantities_dict()
        variants_available = {p['id']: p for p in
                              self.product_variant_ids._origin.read(['free_qty'])}
        for template in self:
            free_qty = 0
            for p in template.product_variant_ids._origin:
                free_qty += variants_available[p.id]["free_qty"]
            prod_available[template.id].update({"free_qty": free_qty, })
        return prod_available

    def _search_free_qty(self, operator, value):
        domain = [('free_qty', operator, value)]
        product_variant_query = self.env['product.product'].sudo()._search(domain)
        return [('product_variant_ids', 'in', product_variant_query)]

    def _website_show_quick_add(self):
        website = self.env['website'].get_current_website()
        res = False
        check_hide_add_to_cart = True if website.b2b_hide_add_to_cart and website.is_public_user() else False
        if not check_hide_add_to_cart:
            res = super(ProductTemplate, self)._website_show_quick_add()
        return res

    def write(self, vals):
        if vals.get('tab_line_ids', False):
            for value in vals.get('tab_line_ids', False):
                if type(value[1]) == int:
                    global_tab = self.env['product.tab.line'].search([('id', '=', value[1])])
                    if global_tab.tab_type == 'global' and value[0] == 1:
                        if global_tab.website_ids:
                            websites_ids = global_tab.website_ids.ids if len(
                                global_tab.website_ids.ids) > 1 else [
                                global_tab.website_ids.id]
                        else:
                            websites_ids = []
                        vals_tab = {'tab_name': global_tab.tab_name,
                                    'is_modified': True,
                                    'parent_id': global_tab.id,
                                    'product_id': self.id,
                                    'tab_type': 'specific product',
                                    'tab_content': value[2].get('tab_content',
                                                                False) or global_tab.tab_content,
                                    'sequence': global_tab.sequence,
                                    'website_ids': [[6, 0, websites_ids]], }
                        self.env['product.tab.line'].create(vals_tab)
                    elif type(value[1]) == int and value[0] == 2:
                        tab_to_delete = self.env['product.tab.line'].search([('id', '=', value[1])])
                        if not tab_to_delete.tab_type == 'global':
                            tab_to_delete.unlink()
                elif type(value[1]) == str and value[0] == 0:
                    vals_tab = value[2]
                    vals_tab.update({'product_id': self.id})
                    self.env['product.tab.line'].create(vals_tab)
        res = super(ProductTemplate, self).write(vals)
        return res

    def _get_product_tabs(self):
        for product in self:
            all_global_product_tabs = self.env['product.tab.line'].search(
                [('tab_type', '=', 'global')])
            product_tabs = self.env['product.tab.line'].search([('product_id', '=', self.id)])
            all_products_tabs = all_global_product_tabs + product_tabs
            product_tabs = all_products_tabs.ids
            for product_tab in all_products_tabs:
                if product_tab.is_modified == True and product_tab.product_id.id == self.id and product_tab.parent_id:
                    if product_tab.parent_id.id in product_tabs:
                        product_tabs.remove(product_tab.parent_id.id)

            product.tab_line_ids = [(6, 0, product_tabs)]

    def _set_product_tabs(self):
        return True

    def remove_cart_button(self):
        if self.detailed_type == 'product' and not self.allow_out_of_stock_order and self.sudo().with_context(
                warehouse=request.website._get_warehouse_available()).free_qty < 1:
            return True
        return False

    def _get_sales_prices(self, pricelist, fiscal_position):
        if not self:
            return {}

        pricelist and pricelist.ensure_one()
        partner_sudo = self.env.user.partner_id
        pricelist = pricelist or self.env['product.pricelist']
        currency = pricelist.currency_id or self.env.company.currency_id
        date = fields.Date.context_today(self)

        sales_prices = pricelist._get_products_price(self, 1.0)
        show_discount = pricelist and pricelist.discount_policy == 'without_discount'

        base_sales_prices = self._price_compute('list_price', currency=currency)
        website = self.env['website'].get_current_website()

        if website.show_line_subtotals_tax_selection == 'tax_excluded':
            tax_display = 'total_excluded'
        else:
            tax_display = 'total_included'

        if pricelist and not pricelist.display_product_price == "system_setting":
            tax_display = pricelist.display_product_price

        res = {}
        for template in self:
            price_reduce = sales_prices[template.id]

            product_taxes = template.sudo().taxes_id.filtered(lambda t: t.company_id == t.env.company)
            taxes = fiscal_position.map_tax(product_taxes)

            base_price = None
            price_list_contains_template = currency.compare_amounts(price_reduce, base_sales_prices[template.id]) != 0

            if template.compare_list_price:
                # The base_price becomes the compare list price and the price_reduce becomes the price
                base_price = template.compare_list_price
                if not price_list_contains_template:
                    price_reduce = base_sales_prices[template.id]

                if template.currency_id != pricelist.currency_id:
                    base_price = template.currency_id._convert(
                        base_price,
                        pricelist.currency_id,
                        self.env.company,
                        date,
                        round=False
                    )

            elif show_discount and price_list_contains_template:
                base_price = base_sales_prices[template.id]

                # Compare_list_price are never tax included
                base_price = self.env['account.tax']._fix_tax_included_price_company(
                    base_price, product_taxes, taxes, self.env.company)
                base_price = taxes.compute_all(base_price, pricelist.currency_id, 1, template, partner_sudo)[
                    tax_display]

            price_reduce = self.env['account.tax']._fix_tax_included_price_company(
                price_reduce, product_taxes, taxes, self.env.company)
            price_reduce = taxes.compute_all(price_reduce, pricelist.currency_id, 1, template, partner_sudo)[
                tax_display]

            template_price_vals = {
                'price_reduce': price_reduce,
            }
            if base_price:
                template_price_vals['base_price'] = base_price

            res[template.id] = template_price_vals

        return res

    def check_stock_availability_message(self):
        self.ensure_one()
        if self.detailed_type == 'product' and self.show_availability and self.free_qty and self.free_qty < self.available_threshold:
            return f"Only {int(self.free_qty)} Units left in stock."

    @api.model
    def _search_get_detail(self, website, order, options):
        """ Add product brand and product attribute values in search fields
        if relevant configurations are enabled in website.
        """
        res = super()._search_get_detail(website, order, options)
        curr_website = self.env['website'].sudo().get_current_website()
        if curr_website.enable_smart_search:
            if curr_website.search_in_brands:
                res['search_fields'].append('product_brand_id.name')
            if curr_website.search_in_attributes_and_values:
                res['search_fields'].append('attribute_line_ids.value_ids.name')

        if options and 'attrib_values' in options:
            domain_new = []
            attrib_values = options['attrib_values']
            if attrib_values:
                ids = []
                for value in attrib_values:
                    if value[0] == 0:
                        ids.append(value[1])
                if ids:
                    domain_new.append(('product_brand_id.id', 'in', ids))
            res['base_domain'][0] = expression.AND([res['base_domain'][0], domain_new])

        if not curr_website.display_out_of_stock or options.get('out_of_stock', False):
            res.get('base_domain', False) and res['base_domain'].append(
                ['|', ('allow_out_of_stock_order', '=', True), '&', ('free_qty', '>', 0),
                 ('allow_out_of_stock_order', '=', False)])

        return res

    def get_slider_product_price(self):
        fiscal_position_sudo = request.website.fiscal_position_id.sudo()
        pricelist = request.website._get_current_pricelist()
        products_prices = lazy(lambda: self._get_sales_prices(pricelist, fiscal_position_sudo))
        return products_prices