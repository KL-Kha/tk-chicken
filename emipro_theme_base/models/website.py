# -*- coding: utf-8 -*-

import base64
import json
import werkzeug.urls
from urllib.parse import urlparse, parse_qs, urlencode

from odoo import api, fields, models, tools, _
from odoo.http import request
from odoo.modules.module import get_resource_path
from odoo.exceptions import ValidationError
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.auth_oauth.controllers.main import OAuthLogin


class Website(models.Model):
    _inherit = "website"


    is_lazy_load = fields.Boolean(string='Lazyload', help="Lazy load will be enabled")
    lazy_load_image = fields.Binary('Lazyload Image', help="Display this image while lazy load applies.")
    is_load_more = fields.Boolean(string='Load More', help="Load more will be enabled")
    load_more_image = fields.Binary('Load More Image', help="Display this image while load more applies.")
    button_or_scroll = fields.Selection([
        ('automatic', 'Automatic- on page scroll'),
        ('button', 'Button- on click button')
    ], string="Loading type for products", required=True, default='automatic')
    prev_button_label = fields.Char(string='Label for the Prev Button',
                                    default="Load prev", translate=True)
    next_button_label = fields.Char(string='Label for the Next Button',
                                    default="Load next", translate=True)
    collapse_filter = fields.Boolean(string='Collapse Filter', help="Collapse will be enabled")

    # B2B xml button and price settings
    b2b_hide_add_to_cart = fields.Boolean('Hide Add to Cart Feature')
    b2b_hide_price = fields.Boolean('Hide Product Price')
    is_b2b_message = fields.Boolean('Display Message?')
    text_b2b_hide_details = fields.Char('Text for Details', default='to view price', translate=True)

    # OUT of STOCK settings
    option_out_of_stock = fields.Boolean('Display Label on Out of Stock Products',
                                         help="If Yes, then message/text will be displayed for out of stock products "
                                              "on shop page")
    text_out_of_stock = fields.Char('Out of Stock Label Text', default='OUT OF STOCK', translate=True)
    display_out_of_stock = fields.Boolean('Display Out of Stock Products', default=True)

    # country settings for billing and shipping
    allow_countries = fields.Selection([('all', 'All Countries'), ('selected', 'Selected Country Group')], 'Allow Countries', default='all')
    country_group_id = fields.Many2one('res.country.group', 'Allow Country Group')
    default_country_id = fields.Many2one('res.country', 'Default Country', default=lambda self: self.env.company.country_id.id)

    # See All
    see_all = fields.Boolean('See All', default=True)
    show_attr_value = fields.Selection([('1', '1'), ('2', '2'), ('3', '3'), ('4', '4'), ('5', '5')],
                                       'Total Attributes Value', default='4')
    homepage_id = fields.Many2one('website.page', string='Homepage')

    # Advanced search
    enable_smart_search = fields.Boolean(
        string="Advanced Search", default=True,
        help="Enable it to activate search synonyms and search keywords reporting.")
    search_in_brands = fields.Boolean(string="Search with Brands", default=True)
    search_in_attributes_and_values = fields.Boolean(string="Search with Attributes", default=True)

    # pwa
    is_pwa = fields.Boolean('PWA', readonly=False, help="Enable Progressive Web Application")
    pwa_name = fields.Char(string='Name', readonly=False,
                           help="It will be used in the splash screen and Add To Home Screen’ pop-up.")
    pwa_short_name = fields.Char(string='Short Name', readonly=False,
                                 help="It will be used in a browser pop-up and the app shortcut name.")
    pwa_theme_color = fields.Char(string='Theme Color', readonly=False,
                                  help="The color is used to customize the look of the browser.")
    pwa_bg_color = fields.Char(string='Background Color', readonly=False,
                               help="The color used to customize the splash screen when launching from the home screen shortcut.")
    pwa_start_url = fields.Char(string='Start URL', readonly=False,
                                help="This is the URL on which the user will be landed when they add this app to the home screen and click on it.")
    app_image_512 = fields.Binary(string='Application Image(512x512)', readonly=False, store=True,
                                  help="It will be used in an app launcher, home screen, splash screen icons. (Required 512x512)")
    show_stock_filter = fields.Boolean('Show Stock Filter in Shop Page', default=True)
    signup_captcha_option = fields.Boolean('Captcha in SignUp', help='Enable Captcha for the signup')

    @api.onchange('signup_captcha_option')
    def _onchange_signup_captcha_option(self):
        if self.signup_captcha_option:
            if not (self.env['ir.config_parameter'].sudo().get_param('recaptcha_private_key') and self.env['ir.config_parameter'].sudo().get_param('recaptcha_public_key')):
                raise ValidationError(_('Please add appropriate captcha in settings.'))

    @api.onchange('is_lazy_load')
    def _onchange_icon_lazy_load(self):
        if self.is_lazy_load:
            img_path = get_resource_path('emipro_theme_base', 'static/src/img/lazyload.gif')
            with tools.file_open(img_path, 'rb') as f:
                self.lazy_load_image = base64.b64encode(f.read())

    @api.onchange('is_load_more')
    def _onchange_icon_load_more(self):
        if self.is_load_more:
            img_path = get_resource_path('emipro_theme_base', 'static/src/img/loadmore.gif')
            with tools.file_open(img_path, 'rb') as f:
                self.load_more_image = base64.b64encode(f.read())

    @api.onchange('b2b_hide_price')
    def _onchange_b2b_hide_price(self):
        if self.b2b_hide_price:
            self.b2b_hide_add_to_cart = True

    @api.constrains('b2b_hide_price', 'b2b_hide_add_to_cart', 'is_b2b_message')
    def _check_b2b_message(self):
        for rec in self:
            if rec.is_b2b_message and rec.is_b2b_message and not (rec.b2b_hide_price or rec.b2b_hide_add_to_cart):
                raise ValidationError(_('You cannot enabled "Display Message?" without using "Hide Add to Cart" or "Hide Product Price".'))

    def display_add_to_cart(self):
        check_hide_add_to_cart = False if self.is_public_user() and self.b2b_hide_add_to_cart else True
        return check_hide_add_to_cart

    def display_product_price(self):
        check_hide_price = False if self.is_public_user() and self.b2b_hide_price else True
        return check_hide_price

    def display_b2b_message(self):
        display_message = True if self.is_public_user() and self.is_b2b_message else False
        return display_message

    def _search_with_fuzzy(self, search_type, search, limit, order, options):
        """ Based on the configuration of search synonyms(should be enabled),
        Search with all the available synonyms of `search` term,
        """
        curr_website = self.env['website'].get_current_website()
        search_synonyms = False
        count, results, fuzzy_term = 0, [], False
        if search and curr_website.enable_smart_search:
            synonym_groups = self.env['synonym.group'].sudo().search(
                [('website_id', 'in', [curr_website.id, False])])
            if synonym_groups:
                for synonym_group in synonym_groups:
                    # Check if any search term available in any synonym group
                    synonyms = [synm.strip().lower() for synm in synonym_group.name.split(',')]
                    if search.strip().lower() in synonyms:
                        search_synonyms = synonyms
                        break
            if search_synonyms:
                for search_synm in search_synonyms:
                    fuzzy_term = False
                    search_details = self._search_get_details(search_type, order, options)
                    if search_synm and options.get('allowFuzzy', True):
                        fuzzy_term = self._search_find_fuzzy_term(search_details, search_synm)
                        if fuzzy_term:
                            new_count, new_results = self._search_exact(search_details, fuzzy_term,
                                                                        limit, order)
                            if fuzzy_term.lower() == search_synm.lower():
                                fuzzy_term = False
                        else:
                            new_count, new_results = self._search_exact(search_details, search_synm,
                                                                        limit, order)
                    else:
                        new_count, new_results = self._search_exact(search_details, search_synm,
                                                                    limit, order)
                    for new_res in new_results:
                        if new_res not in results:
                            res = [res for res in results if res['model'] == new_res['model']]
                            if res:
                                for prod in new_res['results']:
                                    if prod not in res[0]['results']:
                                        res[0]['results'] += prod
                                        res[0]['count'] += 1
                                        count += 1
                            else:
                                results.append(new_res)
                                count += new_res['count']
            else:
                count, results, fuzzy_term = super()._search_with_fuzzy(search_type, search, limit,
                                                                        order, options)
        else:
            count, results, fuzzy_term = super()._search_with_fuzzy(search_type, search, limit,
                                                                    order, options)
        return count, results, fuzzy_term

    def get_shop_products(self, search=False, category=False, attrib_values=False):
        domain = WebsiteSale._get_shop_domain(WebsiteSale(), search, category, attrib_values)
        return self._get_filtered_products(domain)

    def get_brand_products(self, search=False, category=False, attrib_values=False):
        """ Get the product count based on attribute value and current search domain. """
        domain = WebsiteSale._get_shop_domain(WebsiteSale(), search, category, attrib_values)
        domain = [dom for dom in domain if not dom[0] == 'product_brand_id.id']
        return self._get_filtered_products(domain, True)

    def _get_filtered_products(self, domain, is_brand=False):
        query = self.env['product.template']._where_calc(domain)
        self.env['product.template']._apply_ir_rules(query, 'read')
        from_clause, where_clause, where_clause_params = query.get_sql()
        where_str = where_clause and ("WHERE %s" % where_clause) or ''

        if self._context.get('is_brands'):
            brand_id = int(self._context.get("is_brands"))
            where_str += f'AND ("product_template"."product_brand_id" = {brand_id})'

        if is_brand:
            query = f'''select product_brand_id,count(id) as count 
            from product_template 
            where id in (SELECT product_template.id FROM {from_clause} {where_str}) 
            group by product_brand_id'''
        else:

            if request.env.context.get('is_brands_attr'):
                brand_ids = ','.join(str(brand_id) for brand_id in request.env.context.get('is_brands_attr'))
                where_str += f'AND ("product_template"."product_brand_id" in ({brand_ids}))'

            query = f'''select product_attribute_value_id,count(DISTINCT product_tmpl_id) as count 
            from product_template_attribute_value 
            where ptav_active = true AND product_tmpl_id in (SELECT product_template.id FROM {from_clause} {where_str}) 
            group by product_attribute_value_id'''

        self._cr.execute(query, where_clause_params)

        key = "product_brand_id" if is_brand else "product_attribute_value_id"

        result_dict = {}
        for dict in request.env.cr.dictfetchall():
            result_dict[dict[key]] = dict['count']

        return result_dict

    def list_providers_ept(self):
        """
        This method is used for return the encoded url for the auth providers
        :return: link for the auth providers.
        """
        try:
            providers = request.env['auth.oauth.provider'].sudo().search_read([('enabled', '=', True)])
        except Exception:
            providers = []
        for provider in providers:
            return_url = request.httprequest.url_root + 'auth_oauth/signin'
            state = OAuthLogin.get_state(self, provider)
            params = dict(
                response_type='token',
                client_id=provider['client_id'],
                redirect_uri=return_url,
                scope=provider['scope'],
                state=json.dumps(state),
            )
            provider['auth_link'] = "%s?%s" % (provider['auth_endpoint'], werkzeug.urls.url_encode(params))
        return providers

    def get_remove_url(self, url, option, values):
        vals = {}
        shop_url = url
        if option == 'attribute':
            attribute_values = list(filter(lambda l: l[0] != 0, values))
            attribute_dict = {}
            if attribute_values:
                attributes = {v[0] for v in attribute_values}
                attribute_obj = self.env['product.attribute'].sudo()
                attribute_value_obj = self.env['product.attribute.value'].sudo()
                for attribute in attributes:
                    attribute_dict[attribute_obj.browse(attribute)] = []
                for value in attribute_values:
                    current_url = shop_url
                    option_value = '-'.join(str(num) for num in value)
                    attr_url = current_url.replace(f"attrib={option_value}", '')
                    attribute_id = attribute_obj.browse(value[0])
                    attribute_value = attribute_value_obj.browse(value[1])
                    attribute_dict[attribute_id].append({
                        attribute_value: attr_url
                    })
                vals.update(attribute_details=attribute_dict)
            brand_values = list(filter(lambda l: l[0] == 0, values))
            if brand_values:
                brand_details = []
                brand_obj = self.env['product.brand'].sudo()
                for value in brand_values:
                    current_url = shop_url
                    option_value = '-'.join(str(num) for num in value)
                    brand_url = current_url.replace(f"attrib={option_value}", '')
                    brand_id = brand_obj.browse(value[1])
                    brand_details.append({
                        brand_id: brand_url
                    })
                vals.update(brand_details=brand_details)
        if option == 'tag':
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            tags_values = query_params.get('tags', [])
            tag_obj = self.env['product.tag'].sudo()
            tag_details = []
            for value in tags_values:
                current_url = shop_url
                tag_url = current_url.replace(f"tags={value}", "")
                tag_id = tag_obj.browse(int(value))
                tag_details.append({
                    tag_id: tag_url
                })
            vals.update(tag_details=tag_details)
        return vals

    def get_attribute_clear_url(self, url, attribute_id):
        # prepare url
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        query_params['attrib'] = [value for value in query_params.get('attrib', []) if f'{attribute_id.id}-' not in value]
        if f"attrib={attribute_id.id}-" in url:
            new_url = parsed_url._replace(query=urlencode(query_params, doseq=True)).geturl()
            return new_url

    def get_clear_brand_url(self, url):
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        query_params['attrib'] = [value for value in query_params.get('attrib', []) if f'0-' not in value]
        if f"attrib=0-" in url:
            new_url = parsed_url._replace(query=urlencode(query_params, doseq=True)).geturl()
            return new_url

    def get_clear_tag_url(self, url):
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        query_params.pop('tags', None)
        if f"tags" in url:
            new_url = parsed_url._replace(query=urlencode(query_params, doseq=True)).geturl()
            return new_url

    @staticmethod
    def _get_product_sort_mapping():
        return [
            ('website_sequence asc', _('Featured')),
            ('create_date desc', _('Newest Arrivals')),
            ('name asc', _('Name (A-Z)')),
            ('list_price asc', _('Price - Low to High')),
            ('list_price desc', _('Price - High to Low')),
            ('discount asc', _('Discount'))
        ]
    def get_all_product_template_filter(self):
        return self.env.ref('theme_clarico_vega.dynamic_filter_template_product_public_category_style_1').id

    def get_all_product_public_category_template_filter(self):
        return self.env.ref('theme_clarico_vega.dynamic_filter_template_product_public_category_style_1').id

    def get_all_product_brand_template_filter(self):
        return self.env.ref('theme_clarico_vega.dynamic_filter_template_product_brand_style_1').id
