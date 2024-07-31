{
    "name": "Accounting Stock Card",
    "author": "Majorbird",
    "version": "17.0.0.1",
    "category": "Accounting/Accounting",
    "summary": "The Accounting Stock Card module by Majorbird is a robust solution designed to streamline the management of stock movements and inventory control within your accounting system. This module integrates seamlessly with the base accounting functionalities to provide detailed and real-time tracking of stock levels, movements, and related financial transactions. By using this tool, users can ensure accurate inventory records, enhance financial reporting, and improve overall operational efficiency. The Accounting Stock Card is ideal for businesses seeking to maintain precise stock management and gain insights into their inventory's impact on financial performance.",
    "website": "https://majorbird.cn",
    "depends": [
        'base',
        'account',
        'account_accountant',
        'account_reports',
        'stock',
        'purchase',
    ],
    "data": [
        'data/server_action_data.xml',
        'security/ir.model.access.csv',
        'views/x_mjb_stock_card_views.xml',
        'views/x_mjb_stock_card_line_views.xml',
    ],
    "_documentation": {
        "banner": "banner.jpg",
        "icon": "icon.png",
        "excerpt": "A comprehensive tool for managing and tracking stock movements within the accounting module.",
        "summary": "The Accounting Stock Card module by Majorbird is a robust solution designed to streamline the management of stock movements and inventory control within your accounting system. This module integrates seamlessly with the base accounting functionalities to provide detailed and real-time tracking of stock levels, movements, and related financial transactions. By using this tool, users can ensure accurate inventory records, enhance financial reporting, and improve overall operational efficiency. The Accounting Stock Card is ideal for businesses seeking to maintain precise stock management and gain insights into their inventory's impact on financial performance.",
        "issue": "Managing stock movements and inventory control within accounting systems can be complex and prone to errors, leading to inaccurate financial records and operational inefficiencies.",
        "solution": "The Accounting Stock Card module provides a streamlined approach to track and manage stock movements accurately. It integrates with the existing accounting functionalities to offer real-time updates and detailed reporting, ensuring that inventory records are precise and up-to-date.",
        "manual": [
            {
                "title": "Installation and Setup",
                "description": "Install the module name mjb_account_stock_card",
                "images": ["image1.png"]
            },
            {
                "title": "Where to find & How to using the Stock Card",
                "description": "At first, navigate to the Stock card following the instruction. After that we can create a new record to track the current stock in the amount of day.",
                "images": ["image2.png","image3.png","image4.png"]
            },
            {
                "title": "Report Result!",
                "description": "Please enjoy the result!",
                "images": ["image5.png"]
            }
        ],
        "features": [
            {
                "title": "Real-time Stock Tracking",
                "description": "Monitor stock levels and movements in real-time, ensuring accurate and up-to-date inventory records."
            },
            {
                "title": "Seamless Integration",
                "description": "Integrates with existing accounting functionalities for a cohesive and efficient inventory management solution."
            },
            {
                "title": "Detailed Reporting",
                "description": "Generate comprehensive reports that provide insights into stock movements and their financial impact."
            }
        ]
    },
    "license": "OPL-1",
    "installable": True,
    "images": [],
}
