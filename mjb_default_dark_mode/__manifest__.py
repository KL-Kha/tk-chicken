{
    "name": "Default Dark Mode",
    "author": "Majorbird",
    "version": "17.0.0.1",
    "category": "Hidden/Tools",
    "summary": "The module enhances the channel counter within the Discuss app",
    "website": "https://majorbird.cn",
    "depends": ["web"],
    "data": ["views/res_users_form.xml"],
    "assets": {
        "web.assets_backend": [
            "mjb_default_dark_mode/static/src/**/*",
        ],
    },
    "_documentation": {
        "banner": "banner.png",
        "icon": "icon.png",
        "excerpt": "This documentation outlines the functionality to set dark mode as the default theme for specific users.",
        "summary": "The 'Default Dark Mode' module enhances Odoo's original dark mode by allowing users to set it as their default theme.",
        "issue": "Originally, when a user changed the theme to dark mode and logged out, the next time they logged in, it would reset back to light mode.",
        "solution": "This limitation is overcome by implementing programming changes that now allow users to set dark mode as their default theme.",
        "manual": [
            {
                "title": "Module Installation",
                "description": "To install the module, locate it within the app list and click 'Install'.",
                "images": ["image1.png"],
            },
            {
                "title": "Set Dark Mode In User Profile",
                "description": "Set dark mode as default.",
                "images": ["image2.png"],
            },
        ],
        "features": [
            {
                "title": "Set Default Dark Mode In User Profile",
                "description": "Allow users to set dark mode as their default theme in their profile settings.",
            }
        ],
    },
    "license": "OPL-1",
    "installable": True,
    "images": ["static/description/banner_slide.gif"],
}
