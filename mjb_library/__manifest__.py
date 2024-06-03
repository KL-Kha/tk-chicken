# -*- encoding: utf-8 -*-
{
    'name': 'MJB Custom Library',
    'summary': 'Technical functions',
    'version': '17.0.0.1',
    'category': 'Hidden/Tools',
    'summary': """
        Technical functions
        """,
    'author': "Benoit Lavorata",
    "website": "https://majorbird.cn",
    'depends': [
        'base_automation'
    ],
    'data': [
    ],
    'qweb': [
    ],
    '_documentation': {
        "banner": "banner.png",
        "icon": "icon.png",
        "excerpt": "Making a module to execute the library on the UI of the Action Odoo.",
        "summary": "Technical functions",
        "issue": "In some cases, customers need to fix or modify directly without creating a new module.",
        "solution": "This module enables users to execute custom libraries directly on the UI of the Odoo action.",
        "manual": [
            {
                "title": "Installing the Module",
                "description": "You can install the module by navigating to the 'Applications' menu on your Odoo platform. Search for 'MJB Custom Library', and click on 'Install'.",
                "images": ["image1.png"]
            },
            {
                "title": "How To Use This Module?",
                "description": "This module can be used in any action (server action, automated action, scheduled action, etc.). Refer to the provided images for instructions on using the libraries.",
                "images": ["image2.png", "image3.png"]
            },
        ],
        "features": [
            {
                "title": "Optimization!",
                "description": "This feature allows users to add libraries and coding without requiring backend handling."
            },
        ],
    },
    'images': ['static/description/banner_slide.gif'],
    'demo': [],
    'application': False,
    'license': 'OPL-1',
    "installable": True,  
}
