{
    'name': 'Order Line Summary',
    'summary': 'Display the summary of items in each Purchase Order',
    'category': "Purchase/Purchase",
    'version': '17.0.0.1',
    'author': 'Majorbird',
    'website': 'https://majorbird.cn',
    'license': 'OPL-1',
    "depends": [
        'base',
        'base_automation',
        'purchase',
        'sale'
    ],
    "data": [
        'views/mjb_po_summary_config_setting.xml',
        'views/mjb_purchase_order_text_summary.xml',
        'data/auto_summarize_quantities_po.xml',
        'data/cron_summarize_quantities_po.xml'
    ],
    '_documentation': {
        'banner': 'banner.png',
        'icon': 'icon.png',
        'excerpt': 'The Order Line Summary module is a tool to provide a clear, summarised display of purchase line in an order within Odoo, making the management process more efficient.',
        'summary': 'Gain an enhanced approach towards reviewing quantities in your purchase order line. This innovative solution offered by Majorbird allows for an easy, summarized view of your order quantities. Originally a feature not available in Odoo, this module adds value by improving the purchase order review process and ultimately aiding more effective management.',
        'issue': 'The main problem is that Odoo does not originally offer any functionality that can summarize the quantities in a purchase order.',
        'solution': 'The solution was the development of the Purchase Order Text Summary module. This module introduces a new feature to summarize quantities in purchase orders, resulting in better handled and more efficient management of purchases.',
        'manual': [
            {
                'title': 'Installation Process',
                'description': "With a simple click, you can install this module. Navigate to the 'Applications' tab in your Odoo platform, find 'Purchase Order Text Summary' and click on 'Install'. It's that easy.",
                'images': ["image1.png"]
            },
            {
                'title': 'Configuration - Display Preferences',
                'description': "Customizing the summary fields to meet your needs is a breeze. Click on 'Configurations' then 'Settings'. From there, under the 'Majorbird' tab, you can edit the 'Purchase Order Line fields' to your satisfaction.",
                'images': ["image2.png"]
            },
            {
                'title': 'Generate Summaries for Existing Orders',
                'description': 'Use the scheduled action to generate summaries for current purchase orders.',
                'images': ["image3.png"]
            },
            {
                'title': 'Configure and Auto-Generate Summaries',
                'description': 'Summaries for new purchase orders are automatically created according to your configuration settings.',
                'images': ["image4.png"]
            },
        ],
        'features': [
            {
                'title': 'Generate Summaries for Existing Orders',
                'description': 'Use the scheduled action to generate summaries for current purchase orders.',
            },
            {
                'title': 'Configure and Auto-Generate Summaries',
                'description': 'Summaries for new purchase orders are automatically created according to your configuration settings.',
            },
        ],
    },
    'application': True,
    'installable': True,
    'auto_install': False,
    'images': ['static/description/banner_slide.gif']
}
