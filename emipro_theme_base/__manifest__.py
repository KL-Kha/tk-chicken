# -*- coding: utf-8 -*-
{
    # Theme information
    'name': 'Emipro Theme Base',
    'category': 'Base',
    'summary': 'Base module containing common libraries for all Emipro eCommerce themes.',
    'version': '17.0.0.4',
    'license': 'OPL-1',
    'depends': [
        "website_sale_stock_wishlist",
        "website_sale_comparison_wishlist",
        "website_blog",
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/data.xml',
        'views/website.xml',
        'views/product_brand.xml',
        'views/product_template.xml',
        'views/ir_attachment.xml',
        'views/product_tabs.xml',
        'views/product_pricelist.xml',
        'views/website_menu_view.xml',
        'views/product_public_category.xml',
        'views/menu_label.xml',
        'views/product_attribute.xml',
        'views/product_pricelist_item.xml',
        'views/synonym_group.xml',
        'views/search_keyword_report.xml',
        'views/product_label.xml',
        'views/product_ribbon.xml',
        'views/website_snippet_filter.xml',
        'wizards/product_brand_wizard_view.xml',
        'wizards/product_document_config.xml',
        'wizards/product_label_wizard_view.xml',
        'templates/pwa.xml',
        'templates/offilne.xml',
        'templates/assets.xml',
        'templates/template.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'emipro_theme_base/static/src/js/frontend/lazy_load.js',
            'emipro_theme_base/static/src/js/frontend/loadmore.js',
            'emipro_theme_base/static/src/js/frontend/pwa_web.js',
            'emipro_theme_base/static/src/js/frontend/website_sale.js',
        ],
        'web_editor.assets_wysiwyg': [
            'emipro_theme_base/static/src/js/slider_builder_helper.js',
        ],
        'website.assets_editor': [],
        'website.assets_wysiwyg': [],
    },

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'https://www.emiprotechnologies.com',
    'maintainer': 'Emipro Technologies Pvt. Ltd.',

    # Odoo Store Specific
    # 'images': [
        # 'static/description/emipro_theme_base.jpg',
    # ],

    # Technical
    'installable': True,
    'auto_install': False,
    'price': 50.00,
    'currency': 'USD',
}
