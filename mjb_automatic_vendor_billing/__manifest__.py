{
    'name': 'Auto Vendor Billing',
    'version': '17.0.0.1',
    'category': 'Accounting',
    'website': 'majorbird.cn',
    'summary': 'Automatically generate vendor bills based on predefined rules',
    'author': 'Majorbird',
    'depends': [
        'base', 'base_automation', 'purchase','stock' ,'account','mail','utm'
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/action.xml',
        'data/automated_action.xml',
        'views/automatic_vendor_billing.xml',
    ],
    "_documentation": {
        "banner":"banner.png",  
        "icon":"icon.png",
        "excerpt": "Automatically generate vendor bills based on predefined rules.",
        "summary": 'Automatically generate vendor bills based on predefined rules',
        "issue": "The need for customizing Odoo functionalities for specific user groups without the complexity of hard-coded modules.",
        "solution": """
        This module allows you to define rules for automatically generating vendor bills based on predefined criteria.
        The rules can be configured to generate bills whenever POs are received, at the end of certain periods, or based on custom schedules.
        """,
        "manual": [
            {  
                "title":"Installation",  
                "description": "To install, navigate to the Apps module and search for 'Auto Vendor Billing'",  
                "images":["image1.png"]  
            },
            {  
                "title":"Navigation and Configuration",  
                "description": "Navigate to 'Settings' > 'MJB Automatic Billing Rule Engine' > 'Automatic Billing Rule Engine'",  
                "images":["image2.png"]  
            },
            {  
                "title":"Configuring Auto Vendor Billing",  
                "description":"Set up rules for generating vendor bills based on your requirements.",  
                "images":["image3.png"]  
            },
            {  
                "title":"Validate Transfer (For option 'Whenever POs are reveived')",  
                "description":"When validate the transfer, it will automatically create a Vendor Bill (just in case you have set the rule is 'Whenever POs are reveived')",  
                "images":["image4.png"]  
            },
            {  
                "title":"Enjoy the result!",  
                "description":"Please checkout our result for this module and hope you interesting on what we do in here!",  
                "images":["image5.png"]  
            },
        ],
        "features": [
            {
                "title": "Rule-based Billing Generation",
                "description": "Define rules to automatically generate vendor bills upon receiving Purchase Orders, at specific intervals, or according to custom schedules."
            },
            {
                "title": "Streamlined Workflow",
                "description": "Simplify billing processes by automating the generation of vendor bills, reducing manual effort and errors."
            },
            {
                "title": "Enhanced Efficiency",
                "description": "Improve efficiency by eliminating the need for manual bill generation, allowing staff to focus on more critical tasks."
            }
        ]
    },

    "license": "OPL-1",
    'images': ['static/description/icon.png'],
    "application": False,
    "installable": True,
    "auto_install": False,
}