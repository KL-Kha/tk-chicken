# -*- coding: utf-8 -*-

import datetime
import json

from odoo import http, fields, _
from odoo.http import request
from odoo.addons.sale.controllers.portal import CustomerPortal
from odoo.addons.website_sale.controllers.main import WebsiteSale, TableCompute
from odoo.addons.website_sale.controllers.variant import WebsiteSaleVariantController
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.website_sale.controllers import main
from odoo.addons.auth_signup.controllers.main import AuthSignupHome as Home
from odoo.addons.website.controllers.main import Website


class EmiproThemeBase(http.Controller):

    @http.route(['/hover/color'], type='json', auth="public", methods=['POST'], website=True)
    def hover_color(self, product_id=False, value_id=False, **post):
        if product_id and value_id:
            product_id = request.env['product.template'].sudo().browse(product_id)
            variant = product_id.product_variant_ids.product_template_variant_value_ids and product_id.product_variant_ids.filtered(
                lambda p: int(
                    value_id) in p.product_template_variant_value_ids.product_attribute_value_id.ids)[0]
            if variant:
                return {
                    'url': f'/web/image/product.product/{str(variant.id)}/image_512',
                    'product_id': product_id.id,
                }

    @http.route(['/quick_view_item_data'], type='json', auth="public", website=True)
    def get_quick_view_item(self, product_id=None):
        if product_id:
            product = request.env['product.template'].search([['id', '=', product_id]])
            response = http.Response(template="emipro_theme_base.quick_view_container", qcontext={'product': product})
            return response.render()

    @http.route(['/similar_products_item_data'], type='http', auth="public", website=True)
    def similar_products_item_data(self, product_id=None):
        if product_id:
            product = request.env['product.template'].search([['id', '=', product_id]])
            website_ids = [False, request.website.id]
            alternative_products = product.alternative_product_ids.filtered(lambda p: p.sale_ok and p.website_id.id in website_ids)

            def sort_function(value):
                list_price = value.get('list_price', 0)
                price = value.get('price', 0)
                if list_price > price:
                    return (list_price - price) / list_price
                else:
                    return 0

            alternative_products_details = list(map(lambda product: product._get_combination_info(), alternative_products))
            values = {
                'alternative_products': alternative_products_details,
                'website': request.website

            }
            response = http.Response(template="emipro_theme_base.similar_products_view_container", qcontext=values)
            return response.render()


class CustomerPortalExt(CustomerPortal):

    @http.route()
    def account(self, redirect=None, **post):
        """ display only allowed countries in user address page from website portal """
        res = super(CustomerPortal, self).account(redirect=redirect, **post)
        countries = res.qcontext.get('countries', False)
        if countries and request.website.allow_countries == 'selected':
            updated_countries = request.website.country_group_id.country_ids + request.website.default_country_id + request.env.user.partner_id.country_id
            res.qcontext['countries'] = updated_countries
        return res


class WebsiteSaleExt(WebsiteSale):

    def _get_country_related_render_values(self, kw, render_values):
        res = super(WebsiteSaleExt, self)._get_country_related_render_values(kw=kw, render_values=render_values)
        partner_id = int(kw.get('partner_id', -1))
        if request.website.allow_countries == 'selected':
            res[
                'countries'] = request.website.country_group_id.country_ids + request.website.default_country_id if request.website.default_country_id not in request.website.country_group_id.country_ids else request.website.country_group_id.country_ids
        if partner_id == -1:
            mode = render_values['mode']
            default_country = request.website.default_country_id and request.website.default_country_id.exists() or res[
                'country']
            res['country'] = default_country
            res['country_states'] = default_country.get_website_sale_states(mode=mode[1])
        if res['country'] not in res['countries']:
            res['countries'] += res['country']
        if not res['country']:
            res['country'] = request.website.default_country_id
        return res

    @http.route(['/shop/cart_popover'], type='http', auth="public", website=True, sitemap=False)
    def cart_popover(self, **post):
        """
        Main xml management + abandoned xml revival
        access_token: Abandoned xml SO access token
        revive: Revival method when abandoned xml. Can be 'merge' or 'squash'
        """
        order = request.website.sale_get_order()
        if order and order.carrier_id:
            # Express checkout is based on the amout of the sale order. If there is already a
            # delivery line, Express Checkout form will display and compute the price of the
            # delivery two times (One already computed in the total amount of the SO and one added
            # in the form while selecting the delivery carrier)
            order._remove_delivery_line()
        if order and order.state != 'draft':
            request.session['sale_order_id'] = None
            order = request.website.sale_get_order()

        request.session['website_sale_cart_quantity'] = order.cart_quantity

        values = {}

        values.update({
            'website_sale_order': order,
            'date': fields.Date.today(),
            'suggested_products': [],
        })
        if order:
            order.order_line.filtered(lambda l: not l.product_id.active).unlink()
            values['suggested_products'] = order._cart_accessories()
            values.update(self._get_express_shop_payment_values(order))

        values.update(self._cart_values(**post))
        return request.render("emipro_theme_base.cart_popover", values)

    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>',
        '/shop/brands/<model("product.brand"):brand>',
        '/shop/brands/<model("product.brand"):brand>/page/<int:page>',
    ], type='http', auth="public", website=True, sitemap=WebsiteSale.sitemap_shop)
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, ppg=False, **post):
        try:
            min_price = float(min_price)
        except ValueError:
            min_price = 0
        try:
            max_price = float(max_price)
        except ValueError:
            max_price = 0

        website = request.env['website'].get_current_website()
        ppr = http.request.env['website'].get_current_website().shop_ppr or 4
        ppg = http.request.env['website'].get_current_website().shop_ppg or 20
        request_args = request.httprequest.args

        discount = False

        if 'discount' in post.get('order', ''):
            order = post.pop('order')
            discount = True

        res = super(WebsiteSaleExt, self).shop(page=page, category=category, search=search, min_price=min_price,
                                               max_price=max_price, ppg=ppg, **post)

        products = res.qcontext.get('products')
        def sort_function(value):
            list_price = value.get('list_price', 0)
            price = value.get('price', 0)
            if list_price > price:
                return (list_price - price) / list_price
            else:
                return 0

        if discount:
            product_prices_data = list(map(lambda product: product._get_combination_info(), products))
            product_prices_data.sort(key=sort_function, reverse=True)
            res.qcontext.update(products=request.env['product.template'].browse(list(map(lambda p: p.get('product_template_id'), product_prices_data))))

        bins = TableCompute().process(res.qcontext.get('products'), ppg, ppr)

        if post.get('brand', False):
            url = f"""/shop/brands/{slug(post.get('brand', False))}"""
            product_count = len(request.env['product.template'].search(
                [('sale_ok', '=', True), ('website_id', 'in', (False, request.website.id)),
                 ('product_brand_id', '=', post.get('brand', False).id), ]))

            pager = website.pager(url=url, total=product_count, page=page, step=ppg, scope=7, url_args=None)

            Category = request.env['product.public.category'].sudo()
            search_categories = Category.search(
                [('product_tmpl_ids', 'in', res.qcontext.get('search_product').ids)]).parents_and_self

            res.qcontext.update(
                {'pager': pager, 'products': res.qcontext.get('products'), 'bins': bins, 'search_count': product_count,
                 'brand_val': post.get('brand', False), 'categories': search_categories})

        # Create Report for the search keyword
        curr_website = request.website.get_current_website()
        if search and curr_website.enable_smart_search:
            search_term = ' '.join(search.split()).strip().lower()
            attrib = res.qcontext.get('attrib_values', False)
            if search_term and not category and not attrib and page == 0:
                request.env['search.keyword.report'].sudo().create({
                    'search_term': search_term,
                    'no_of_products_in_result': res.qcontext.get('search_count', 0),
                    'user_id': request.env.user.id
                })

        product_ids = res.qcontext.get('search_product', request.env['product.template'].sudo())

        # preapare count and search details parametres
        attrib_list = request_args.getlist('attrib')
        attrib_values = [[int(x) for x in v.split("-")] for v in attrib_list if v]
        attrib_set = {v[1] for v in attrib_values}

        filter_by_price_enabled = website.is_view_active('website_sale.filter_products_price')
        if filter_by_price_enabled:
            company_currency = website.company_id.currency_id
            conversion_rate = request.env['res.currency']._get_conversion_rate(
                company_currency, website.currency_id, request.website.company_id, fields.Date.today())
        else:
            conversion_rate = 1

        filter_by_tags_enabled = website.is_view_active('website_sale.filter_products_tags')
        if filter_by_tags_enabled:
            tags = request_args.getlist('tags')
            # Allow only numeric tag values to avoid internal error.
            if tags and all(tag.isnumeric() for tag in tags):
                post['tags'] = tags
            else:
                post['tags'] = None

        # Category Count
        category_count = self.get_category_count_details(product_ids, category, attrib_values, min_price, max_price,
                                                         conversion_rate, website, attrib_set, search, **post)
        res.qcontext.update(category_count=category_count)

        # Tag Count
        tag_count = self.get_tag_count_details(product_ids, category, attrib_values, min_price, max_price,
                                               conversion_rate, website, attrib_set, search, **post)
        res.qcontext.update(tag_count=tag_count)

        if attrib_values:
            attribute_value_count = {}
            for attribute in res.qcontext.get('attributes'):
                attrib_values_list = attrib_values
                modified_list = [sublist for sublist in attrib_values_list if sublist[0] != attribute.id]
                options = self._get_search_options(
                    category=category,
                    attrib_values=modified_list, min_price=min_price,
                    max_price=max_price,
                    conversion_rate=conversion_rate,
                    display_currency=website.currency_id,
                    **post
                )
                fuzzy_search_terms, product_counts, search_products = self._shop_lookup_products(attrib_set, options, post,
                                                                                                 search, website)
                products = search_products.ids
                attribute_counts = self.get_attribute_value_count(products)
                for attribute_id, count in attribute_counts.items():
                    if attribute_id in attribute.value_ids.ids:
                        attribute_value_count[attribute_id] = count
            res.qcontext.update(attribute_value_count=attribute_value_count)
        else:
            options = self._get_search_options(
                category=category,
                attrib_values=attrib_values, min_price=min_price,
                max_price=max_price,
                conversion_rate=conversion_rate,
                display_currency=website.currency_id,
                **post
            )
            fuzzy_search_terms, product_counts, search_products = self._shop_lookup_products(attrib_set, options, post,
                                                                                             search, website)
            # Attribute Value Count
            products = search_products.ids
            attribute_value_count = self.get_attribute_value_count(products)
            res.qcontext.update(attribute_value_count=attribute_value_count)

        # Brand Value Count
        products = product_ids.ids
        brand_value_count = self.get_attribute_value_count(products, is_brand=True)
        res.qcontext.update(brand_value_count=brand_value_count)

        brands = request.env['product.brand'].sudo().search([('website_published', '=', True)])
        if None in brand_value_count.keys() and len(brand_value_count.keys()) > 1:
            res.qcontext.update(brands=brands)

        res.qcontext.update(bins=bins)

        return res

    def get_category_count_details(self, product_ids, category, attrib_values, min_price, max_price, conversion_rate, website, attrib_set, search, **post):
        category_count = {}
        category_products = product_ids.ids
        ecom_categ_ids = request.env['product.public.category'].sudo().search([])
        if category:
            options = self._get_search_options(
                category=None,
                attrib_values=attrib_values, min_price=min_price,
                max_price=max_price,
                conversion_rate=conversion_rate,
                display_currency=website.currency_id,
                **post
            )
            fuzzy_search_term, product_count, search_product = self._shop_lookup_products(attrib_set, options, post, search, website)
            category_products.extend(search_product.ids)
        domain = [('public_categ_ids', 'child_of', ecom_categ_ids.ids), ('id', 'in', category_products)]
        read_group_res = request.env['product.template'].sudo()._read_group(domain, ['public_categ_ids'], ['__count'])
        group_data = {categ.id: count for categ, count in read_group_res}
        for categ in ecom_categ_ids:
            product_count = 0
            for sub_categ_id in categ.search([('id', 'child_of', categ.ids)]).ids:
                product_count += group_data.get(sub_categ_id, 0)
            category_count.update({categ.id: product_count})
        # res.qcontext.update(category_count=category_count)
        return category_count

    def get_tag_count_details(self, product_ids, category, attrib_values, min_price, max_price, conversion_rate, website, attrib_set, search, **post):
        tags_dict = None
        tag_products = product_ids.ids
        if post.get('tags'):
            tags_dict = post.pop('tags') if 'tags' in post else None
            options = self._get_search_options(
                category=category,
                attrib_values=attrib_values,
                min_price=min_price,
                max_price=max_price,
                conversion_rate=conversion_rate,
                display_currency=website.currency_id,
                **post
            )
            fuzzy_search_term, product_count, search_product = self._shop_lookup_products(attrib_set, options, post, search, website)
            tag_products.extend(search_product.ids)
        post['tags'] = tags_dict
        product_tag_ids = request.env['product.tag'].sudo().search([])
        domain = [('product_tag_ids', 'in', product_tag_ids.ids), ('id', 'in', tag_products)]
        read_group_res = request.env['product.template'].sudo()._read_group(domain, ['product_tag_ids'], ['__count'])
        tag_count = {tag.id: count for tag, count in read_group_res}
        return tag_count

    def get_attribute_value_count(self, products, is_brand=False):
        attribute_value_count = {}
        domain = [('id', 'in', products)]
        query = request.env['product.template']._where_calc(domain)
        request.env['product.template']._apply_ir_rules(query, 'read')
        from_clause, where_clause, where_clause_params = query.get_sql()
        where_str = where_clause and ("WHERE %s" % where_clause) or ''

        if is_brand:
            query = f'''select product_brand_id,count(id) as count 
                        from product_template 
                        where id in (SELECT product_template.id FROM {from_clause} {where_str}) 
                        group by product_brand_id'''
            request._cr.execute(query, where_clause_params)
        else:
            query = f'''select product_attribute_value_id,count(DISTINCT product_tmpl_id) as count 
                        from product_template_attribute_value 
                        where ptav_active = true AND product_tmpl_id in (SELECT product_template.id FROM {from_clause} {where_str}) 
                        group by product_attribute_value_id'''
            request._cr.execute(query, where_clause_params)

        # key = "product_attribute_value_id"
        key = "product_brand_id" if is_brand else "product_attribute_value_id"

        for dict in request.env.cr.dictfetchall():
            attribute_value_count[dict[key]] = dict['count']

        return attribute_value_count
        # res.qcontext.update(attribute_value_count=attribute_value_count)

    def _shop_lookup_products(self, attrib_set, options, post, search, website):
        # No limit because attributes are obtained from complete product list
        if post.get('out_of_stock') == '1':
            options.update(out_of_stock=1)
        fuzzy_search_term, product_count, search_result = super(WebsiteSaleExt, self)._shop_lookup_products(
            attrib_set=attrib_set, options=options, post=post,
            search=search, website=website)

        brand = int(post.get('brand', False))
        if brand and search_result:
            search_result = search_result.filtered(lambda l: l.product_brand_id.id == brand)

        return fuzzy_search_term, product_count, search_result

    @http.route(['/shop/clear_cart'], type='json', auth="public", website=True)
    def clear_cart(self):
        """
        Clear the xml in e-commerce website
        @return: -
        """
        order = request.website.sale_get_order()
        order and order.website_order_line.unlink()
        request.session['website_sale_cart_quantity'] = 0

    # Render the Hotspot Product popover template
    @http.route('/get-pop-up-product-details', type='http', auth='public', website=True)
    def get_popup_product_details(self, **kw):
        """
        Render the Hotspot Product popover template
        @param kw: dict for product details
        @return: response for template
        """
        product = int(kw.get('product'))
        if kw.get('product', False):
            product = request.env['product.template'].sudo().browse(product)
            values = {'product': product}
            return request.render("theme_clarico_vega.product_add_to_cart_popover", values, headers={'Cache-Control': 'no-cache'})


class WebsiteExt(main.Website):
    """ Extended controller for website methods
    """

    @http.route([
        '/website/search',
        '/website/search/page/<int:page>',
        '/website/search/<string:search_type>',
        '/website/search/<string:search_type>/page/<int:page>',
    ], type='http', auth="public", website=True, sitemap=False)
    def hybrid_list(self, page=1, search='', search_type='all', **kw):
        """ Create record of search keyword report when searching on the main search bar of website
        """
        result = super().hybrid_list(page=page, search=search, search_type=search_type, **kw)

        # Create Report for the search keyword
        curr_website = request.website.get_current_website()
        if search and curr_website.enable_smart_search:
            search_term = ' '.join(search.split()).strip().lower()
            if search_term:
                request.env['search.keyword.report'].sudo().create({
                    'search_term': search_term,
                    'no_of_products_in_result': result.qcontext.get('search_count', 0),
                    'user_id': request.env.user.id
                })
        return result

    @http.route()
    def autocomplete(self, search_type=None, term=None, order=None, limit=5, max_nb_chars=999,
                     options=None):
        """ Render categories and brand and attribute value information based on the configuration
        of the Advanced search
        """
        if search_type == 'products':
            search_type = 'products_only'
        res = super().autocomplete(search_type, term, order, limit, max_nb_chars, options)
        filtered_results = [rs for rs in res['results'] if rs.get('_fa') != 'fa-folder-o']
        res['results'] = filtered_results
        current_website = request.website.get_current_website()
        categories = request.env['product.public.category'].sudo().search(
            [('website_id', 'in', (False, current_website.id))]
        ).filtered(lambda catg: term.strip().lower() in catg.name.strip().lower())
        search_categories = []
        for categ in categories:
            search_categories.append({'_fa': 'fa-folder-o', 'name': categ.name,
                                      'website_url': f'/shop/category/{categ.id}'})
        res['categories'] = search_categories[:10]
        if term and current_website and current_website.enable_smart_search:
            is_quick_link = {'status': False}
            brand = request.env['product.brand'].sudo().search(
                [('website_id', 'in', (False, current_website.id))]).filtered(
                lambda b: term.strip().lower() in b.name.strip().lower())
            if brand and current_website.search_in_brands:
                is_quick_link.update({'status': True,
                                      'navigate_type': 'brand',
                                      'name': brand[0].name,
                                      'url': f'/shop/brands/{brand[0].id}'})
            elif current_website.search_in_attributes_and_values:
                pat_val = request.env['product.attribute.value'].sudo().search(
                    []).filtered(
                    lambda value: term.strip().lower() in value.name.strip().lower())
                if pat_val:
                    is_quick_link.update({'status': True,
                                          'navigate_type': 'attr_value',
                                          'name': pat_val[0].name,
                                          'attribute_name': pat_val[0].attribute_id.name,
                                          'url': f'/shop?search=&attrib='
                                                 f'{pat_val[0].attribute_id.id}-{pat_val[0].id}'})
            res['is_quick_link'] = is_quick_link
        return res

    @http.route('/see_all', type='json', auth="public", methods=['POST'], website=True)
    def get_see_all(self, attr_id='', is_mobile='', is_tag=''):
        if attr_id and attr_id != '0':
            attributes = request.env['product.attribute'].search([('id', '=', attr_id), ('visibility', '=', 'visible')])

            if is_mobile == 'True':
                response = http.Response(template="theme_clarico_vega.see_all_attr_mobile",
                                         qcontext={'attributes': attributes})

            else:
                response = http.Response(template="theme_clarico_vega.see_all_attr",
                                         qcontext={'attributes': attributes})

        elif attr_id and attr_id == '0':
            brands = request.env['product.brand'].sudo().search([('website_published', '=', True)])
            if is_mobile == 'True':
                response = http.Response(template="theme_clarico_vega.see_all_attr_brand_mobile",
                                         qcontext={'brands': brands})
            else:
                response = http.Response(template="theme_clarico_vega.see_all_attr_brand",
                                         qcontext={'brands': brands})

        elif is_tag:
            ProductTag = request.env['product.tag'].sudo().search([('visible_on_ecommerce', '=', True)])
            response = http.Response(template="theme_clarico_vega.see_all_tags",
                                     qcontext={'all_tags': ProductTag})

        return response.render()

    @http.route(website=True, auth="public", sitemap=False, csrf=False)
    def web_login(self, *args, **kw):
        """
            Login - overwrite of the web login so that regular users are redirected to the backend
            while portal users are redirected to the same page from popup
            Returns formatted data required by login popup in a JSON compatible format
        """
        login_form_ept = kw.get('login_form_ept', False)
        if 'login_form_ept' in kw.keys():
            kw.pop('login_form_ept')
        response = super(WebsiteExt, self).web_login(*args, **kw)
        if login_form_ept:
            if response.is_qweb and response.qcontext.get('error', False):
                return json.dumps(
                    {'error': response.qcontext.get('error', False), 'login_success': False,
                     'hide_msg': False})
            else:
                if request.params.get('login_success', False):
                    uid = request.session.authenticate(request.session.db, request.params['login'],
                                                       request.params['password'])
                    user = request.env['res.users'].browse(uid)
                    redirect = '1'
                    if user.totp_enabled:
                        redirect = request.env(user=uid)['res.users'].browse(uid)._mfa_url()
                        return json.dumps(
                            {'redirect': redirect, 'login_success': True, 'hide_msg': True})
                    if user.has_group('base.group_user'):
                        redirect = b'/web?' + request.httprequest.query_string
                        redirect = redirect.decode('utf-8')
                    return json.dumps(
                        {'redirect': redirect, 'login_success': True, 'hide_msg': False})
        return response


class WebsiteSaleVariantControllerEpt(WebsiteSaleVariantController):

    @http.route('/website_sale/get_combination_info', type='json', auth='public', methods=['POST'], website=True)
    def get_combination_info_website(self, product_template_id, product_id, combination, add_qty,
                                     parent_combination=None, **kwargs):
        res = super(WebsiteSaleVariantControllerEpt, self).get_combination_info_website(
            product_template_id=product_template_id, product_id=product_id, combination=combination, add_qty=add_qty,
            parent_combination=parent_combination, **kwargs)
        product = request.env['product.product'].sudo().search([('id', '=', res.get('product_id'))])
        product_tempate = request.env['product.template'].sudo().search([('id', '=', product_template_id)])
        res.update({
            'sku_details': product.default_code if product_tempate.product_variant_count > 1 else product_tempate.default_code})
        pricelist = request.website._get_current_pricelist()
        if request.website.display_product_price():
            res['price_table_details'] = pricelist.enable_price_table and self.get_price_table(pricelist, product,
                                                                                               product_tempate)
        details = self.get_offer_details(pricelist, product, add_qty)
        res.update(details)

        return res

    def get_price_table(self, pricelist, product, product_tempate):
        current_date = datetime.datetime.now()
        items = pricelist._get_applicable_rules(product, current_date)
        # Get the rules based on the priority based on condition
        updated_rules = (items.filtered(
            lambda rule: rule.applied_on == '0_product_variant' and rule.product_id.id == product.id)
                         or items.filtered(
                    lambda rule: rule.applied_on == '1_product' and rule.product_tmpl_id.id == product_tempate.id)
                         or items.filtered(lambda
                                               rule: rule.applied_on == '2_product_category' and rule.categ_id.id in product_tempate.categ_id.search(
                    [('id', 'parent_of', product_tempate.categ_id.ids)]).ids)
                         or items.filtered(lambda rule: rule.applied_on == '3_global'))
        price_list_items = []
        minimum_qtys = set(updated_rules.mapped('min_quantity'))
        minimum_qtys.add(1)
        minimum_qtys.discard(0)
        minimum_qtys = list(minimum_qtys)
        minimum_qtys.sort()
        for qty in minimum_qtys:
            price = pricelist._get_product_price(product=product, quantity=qty, target_currency=pricelist.currency_id)
            data = {'qty': int(qty), 'price': price}
            price_list_items.append(data)
        price_list_vals = {
            'pricelist_items': price_list_items,
            'currency_id': pricelist.currency_id,
        }
        price_table_details = http.Response(template="emipro_theme_base.product_price_table",
                                            qcontext=price_list_vals).render()
        return price_table_details

    def get_offer_details(self, pricelist, product, add_qty):
        offer_details = {
            'is_offer': False
        }
        try:
            vals = pricelist._compute_price_rule(product, add_qty)
            if vals.get(int(product)) and vals.get(int(product))[1]:
                suitable_rule = vals.get(int(product))[1]
                suitable_rule = request.env['product.pricelist.item'].sudo().browse(suitable_rule)
                if suitable_rule.date_end and suitable_rule.is_display_timer:
                    start_date = int(round(datetime.datetime.timestamp(suitable_rule.date_start) * 1000))
                    end_date = int(round(datetime.datetime.timestamp(suitable_rule.date_end) * 1000))
                    current_date = int(round(datetime.datetime.timestamp(datetime.datetime.now()) * 1000))
                    offer_details.update({
                        'is_offer': True,
                        'start_date': start_date,
                        'end_date': end_date,
                        'current_date': current_date,
                        'suitable_rule': suitable_rule,
                        'offer_msg': suitable_rule.offer_msg,
                    })
        except Exception as e:
            return offer_details
        return offer_details


class AuthSignupHome(Home):

    @http.route(website=True, auth="public", sitemap=False, csrf=False)
    def web_auth_signup(self, *args, **kw):
        """
            Signup from popup and redirect to the same page
            Returns formatted data required by login popup in a JSON compatible format
        """
        qcontext = self.get_auth_signup_qcontext()

        if 'signup_form_ept' in kw.keys():
            kw.pop('signup_form_ept')

        login_email = kw.get('login', False)

        def recaptcha_token_verification(token=None):
            ip_addr = request.httprequest.remote_addr
            recaptcha_result = request.env['ir.http']._verify_recaptcha_token(ip_addr, token)
            if recaptcha_result in ['is_human', 'no_secret', 'is_bot']:
                return [True, 'Validation Successful']
            if recaptcha_result == 'wrong_secret':
                return [False, 'The reCaptcha private key is invalid.']
            elif recaptcha_result == 'wrong_token':
                return [False, 'The reCaptcha token is invalid.']
            elif recaptcha_result == 'timeout':
                return [False, 'Your request has timed out, please retry.']
            elif recaptcha_result == 'bad_request':
                return [False, 'The request is invalid or malformed.']
            else:
                return [False, "Form didn't submitted, Try again"]

        # Check google recaptcha if available
        if login_email and 'error' not in qcontext and request.httprequest.method == 'POST':
            if request.website.signup_captcha_option:
                token = ''
                if 'recaptcha_token_response' in kw.keys():
                    token = kw.pop('recaptcha_token_response')
                if 'recaptcha_token_response' in request.params:
                    request.params.pop('recaptcha_token_response')
                verification = recaptcha_token_verification(token)
                if not verification[0]:
                    qcontext['captcha_error'] = _(verification[1])

        if 'captcha_error' in qcontext:
            return json.dumps(
                {'error': qcontext.get('captcha_error', False), 'login_success': False})

        response = super(AuthSignupHome, self).web_auth_signup(*args, **kw)
        if request.httprequest.method == 'POST':
            if response.is_qweb and response.qcontext.get('error', False):
                return json.dumps(
                    {'error': response.qcontext.get('error', False), 'login_success': False})
            else:
                return json.dumps({'redirect': '1', 'login_success': True})

        return response

    @http.route(auth='public', website=True, sitemap=False, csrf=False)
    def web_auth_reset_password(self, *args, **kw):
        """
            Reset password from popup and redirect to the same page
            Returns formatted data required by login popup in a JSON compatible format
        """
        reset_form_ept = kw.get('reset_form_ept', False)
        if 'reset_form_ept' in kw.keys():
            kw.pop('reset_form_ept')
        response = super(AuthSignupHome, self).web_auth_reset_password(*args, **kw)
        if reset_form_ept:
            if response.is_qweb and response.qcontext.get('error', False):
                return json.dumps({'error': response.qcontext.get('error', False)})
            elif response.is_qweb and response.qcontext.get('message', False):
                return json.dumps({'message': response.qcontext.get('message', False)})
        return response


class WebsiteSnippetFilterEpt(Website):

    @http.route('/website/snippet/filters', type='json', auth='public', website=True)
    def get_dynamic_filter(self, filter_id, template_key, limit=None, search_domain=None, with_sample=False, **post):
        dynamic_filter = request.env['website.snippet.filter'].sudo().search(
            [('id', '=', filter_id)] + request.website.website_domain()
        )
        add2cart = post.get('product_context', {}).get('add2cart') == 'true'
        compare = post.get('product_context', {}).get('compare') == 'true'
        wishlist = post.get('product_context', {}).get('wishlist') == 'true'
        rating = post.get('product_context', {}).get('rating') == 'true'
        quickview = post.get('product_context', {}).get('quickview') == 'true'
        color_swatches = post.get('product_context', {}).get('color_swatches') == 'true'
        image_flipper = post.get('product_context', {}).get('image_flipper') == 'true'
        product_label = post.get('product_context', {}).get('product_label') == 'true'
        count = post.get('brand_context', {}).get('count') or post.get('category_context', {}).get('count') == 'true'
        return dynamic_filter and dynamic_filter.with_context(add2cart=add2cart, compare=compare, wishlist=wishlist, rating=rating, quickview=quickview, color_swatches=color_swatches, image_flipper=image_flipper, product_label=product_label, count=count)._render(template_key, limit, search_domain, with_sample) or []
