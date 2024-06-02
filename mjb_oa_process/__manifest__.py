# -*- coding: utf-8 -*-
{
    'name': "Office Approval Process",
    'version': '17.0.0.2',
    'license': 'OPL-1',
    'summary': "Enable Dynamic Validation Process.",
    'sequence': 20,
    'category': 'Hidden/Tools',
    'author': 'Majorbird',
    'website': 'https://majorbird.cn/',
    'support': 'odoo@majorbird.cn',
    'description': """
        Enable Dynamic Validation Process.
        ===============================================================
        Enable Dynamic Process for Records Validation. This function can be done on any kind of records, and can be dynamically changed
    """,
    'depends': [
                'web',
                'mail'],
    'data': [
        "security/ir.model.access.csv",
        # 'views/assets.xml',
        'views/fal_vprocess.xml',
        'views/fal_vprocess_step.xml',
        'views/fal_vprocess_rule.xml',
        'views/fal_vprocess_execution.xml',
        'views/ir_filters.xml',
    ],
    "_documentation": {
        "banner": "banner.png",
        "icon": "icon.png",
        "excerpt": "Enable a Dynamic Validation Process for Records.",
        "summary": "The Office Approval Process module enables a dynamic validation process for records, allowing you to dynamically change validation criteria on various types of records.",
        "issue": "In many businesses, there is a need for flexible validation processes that can adapt to different record types and requirements.",
        "solution": "The Office Approval Process module provides a solution by allowing users to define and modify validation criteria for different records within the system.",
        "manual": [
            {
                "title": "Installation",
                "description": "Find the module in the app list and click install!",
                "images": ["image1.png"],
            },
            {
                "title": "Configuration",
                "description": "Configure the module settings as per your organization's requirements.",
                "images": ["image2.png"],
            },
        ],
        "features": [
            {
                "title": "Dynamic Validation",
                "description": "Enable dynamic validation processes for different types of records, providing flexibility in your workflow.",
            },
            {
                "title": "User-Friendly",
                "description": "The module is designed to be user-friendly, making it easy for users to define and manage validation criteria.",
            },
        ],
    },
    "images": ['static/description/banner_slide.gif'],
    'demo': [
    ],
    'price': 630.00,
    'currency': 'EUR',
    'application': False,
    "assets": {
        "web.assets_qweb": [
            # "mjb_oa_process/static/src/xml/*.xml",
        ],
        "web.assets_backend": [
            "mjb_oa_process/static/src/scss/Falinwa/falinwa.scss",
            # "mjb_oa_process/static/src/js/Falinwa/Falinwa.config.js",
            # "mjb_oa_process/static/src/js/Falinwa/Falinwa.helper.js",
            # "mjb_oa_process/static/src/js/Falinwa/Falinwa.queryEngine.js",
            "mjb_oa_process/static/src/js/Falinwa/Falinwa.validationProcess.js",
            # "mjb_oa_process/static/src/js/Falinwa/Falinwa.js",
        ],
    },
}
