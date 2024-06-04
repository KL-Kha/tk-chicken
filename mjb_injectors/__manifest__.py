{
    "name": "MJB Injector JS/XML/CSS",
    "author": "Majorbird",
    "version": "17.0.0.1",
    "category": "Hidden/Tools",
    "website": "https://majorbird.cn",
    "summary": "MJB Injector JS/XML/CSS is a versatile Odoo module that empowers users to inject custom JavaScript, CSS, and XML code during page load, tailored for specific user groups. Unlike standard Odoo scripts, the injected code remains uncompressed and uncached, allowing users to enhance Odoo functionalities effortlessly. For instance, users can swiftly modify Odoo's appearance for specific user groups or add shortcut menus. The module provides a curated collection of online snippets, expediting the process of creating personalized tweaks. It's important to review and validate the code before execution, and rest assured, no data is collected through this module.",
    "depends": ["base", "web", "web_editor"],
    "data": [
        "data/data.xml",
        "views/mjb_injector_view.xml",
        "views/res_users_view.xml",
        "security/ir.model.access.csv"
    ],
    'assets': {
        'web.assets_backend':[
            '/web/static/lib/ace/ace.js',
            '/web/static/lib/ace/javascript_highlight_rules.js',
            '/web/static/lib/ace/mode-xml.js',
            '/web/static/lib/ace/mode-qweb.js',
            '/web/static/lib/ace/mode-scss.js',
            '/web/static/lib/ace/mode-js.js',
            '/web/static/lib/ace/theme-monokai.js',
            '/mjb_injectors/static/src/js/mjb_injector.js',
            '/mjb_injectors/static/src/vendor/prism/prism.js',
            '/mjb_injectors/static/src/vendor/prism/prism.css'
        ]
    },
    'images': [
        'static/description/banner_slide.gif'
    ],
    "_documentation": {
        "banner":"banner.png",  
        "icon":"icon.png",
        "excerpt": "Inject custom JS/CSS/XML at page load without writing modules. Quick boilerplate snippets library available.",
        "summary": "MJB Injector JS/XML/CSS is a versatile Odoo module that empowers users to inject custom JavaScript, CSS, and XML code during page load, tailored for specific user groups. Unlike standard Odoo scripts, the injected code remains uncompressed and uncached, allowing users to enhance Odoo functionalities effortlessly. For instance, users can swiftly modify Odoo's appearance for specific user groups or add shortcut menus. The module provides a curated collection of online snippets, expediting the process of creating personalized tweaks. It's important to review and validate the code before execution, and rest assured, no data is collected through this module.",
        "issue": "The need for customizing Odoo functionalities for specific user groups without the complexity of hard-coded modules.",
        "solution": "MJB Injector JS/XML/CSS addresses the challenge by enabling users to inject JavaScript, CSS, and XML code directly into Odoo pages during the loading process. This streamlined approach allows users to implement custom features without the overhead of developing dedicated modules. The module also offers a repository of boilerplate snippets, facilitating rapid customization. Users can modify Odoo's appearance, integrate shortcut menus, and enhance user experience with ease.",
        "manual": [
            {  
                "title":"Installation",  
                "description": "To install, navigate to the Apps module and search for 'MJB Injector JS/XML/CSS'",  
                "images":["image1.png"]  
            },
            {  
                "title":"Navigation and Configuration",  
                "description": "Navigate to 'Settings' > 'Injector' > 'MJB Injector JS/XML/CSS' then Create and configure an Injector for your custom code.",  
                "images":["image2.png"]  
            },
            {  
                "title":"Inject Custom Code",  
                "description":"This streamlined approach allows users to implement custom features without the overhead of developing dedicated modules. Please enjoy for the result!",  
                "images":["image3.png","image4.png"]  
            },
        ],
        "features": [
            {
                "title": "Custom Code Injection",
                "description": "Inject JavaScript, CSS, and XML code at page load for specific user groups without the need for dedicated modules."
            },
            {
                "title": "Online Snippets Library",
                "description": "Browse a curated collection of code snippets to expedite the customization process."
            },
            {
                "title": "User-Friendly Interface",
                "description": "Intuitive module configuration settings for defining target user groups and applying custom code."
            }
        ]
    },
    "license": "OPL-1",
    "application": False,
    "installable": True,
    'price': '55.00',
    'currency': 'USD',
}
