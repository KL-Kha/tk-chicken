{  
    "name": "Field History Tracking",
    "author": "Majorbird",  
    "version": "17.0.0.1",
    "category": "Hidden/Tools",
    "price": 75,
    "currency": 'USD',
    "summary": "This module offers an advanced tracking solution for changes in fields within the Odoo system. This extension provides the ability to track BOM and BOM line for SEA",
    "website": "https://majorbird.cn",
    "depends": [  
        'base',  
        'base_automation',
    ],  
    "data": [
        # 'data/server_action.xml',
        'security/ir.model.access.csv',  
        'views/x_mjb_field_history_tracking_views.xml',
    ],  
    "_documentation": {  
        "banner": "banner.png",
        "icon": "icon.png",  
        "excerpt": "The Field History Tracking module enhances your Odoo experience by enabling the tracking of field changes.",  
        "summary": "The Field History Tracking module, developed by Majorbird, offers an advanced tracking solution for changes in fields within the Odoo system. While the default Odoo system provides basic tracking capabilities, this extension expands upon that, providing the ability to track whichever fields you require. This flexibility allows system users to stay informed about the state of their data and any alterations that take place. From changes in sales orders to modifications in manufacturing orders, or updates in purchase orders, users can manage and maintain oversight over their data with ease.",  
        "issue": "The default Odoo system only supports tracking for selected fields. Users may need to monitor specific changes in the fields of their choice within their Odoo system.",  
        "solution": "To address this limitation, we designed the Field History Tracking module. This system lets users create customized settings, empowering them to track any field they deem essential.",  
        "manual": [  
            {  
                "title": "Module Installation",  
                "description": "To install the Field History Tracking module, navigate to the 'Applications' menu on your Odoo platform. Here you can search for 'Field History Tracking', then simply click on 'Install' to add this feature to your system.",  
                "images": ["image1.png"],  
            },  
            {  
                "title": "Accessing the 'History Tracking' Rule",  
                "description": "The 'History Tracking' rule can be found within the 'Technical' menu of your Odoo platform.",  
                "images": ["image2.png"],  
            },  
            {  
                "title": "Customizing Your History Tracking Rules",  
                "description": "The 'History Tracking' rule setup allows you to define specific field tracking rules based on your unique needs.",  
                "images": ["image3.png"],  
            },  
            {  
                "title": "Field Updates in the Chatter Box",  
                "description": "Changes to specified fields are conveniently updated in the Chatter box for easy monitoring.",  
                "images": ["image4.png"],  
            },  
        ],  
        "features": [  
            {  
                "title": "Field Type Differentiation",  
                "description": "The rules in History Tracking are differentiated based on field type. This includes 'Fields' which represent types that are not 'one2many' or 'many2many', and 'Relation Fields' which stand for the rest.",  
            },  
            {  
                "title": "Updated Value Emphasis",  
                "description": "To enhance visibility, new and old values of updated fields are highlighted with different colors.",  
            },  
        ],  
    },  
    "license": "OPL-1",  
    "installable": True,  
    "images": ['static/description/banner_slide.gif']
}  
