
from odoo import api, models


class ThemeClaricoVega(models.AbstractModel):
    _inherit = 'theme.utils'

    @api.model
    def _reset_default_config(self):

        self.disable_view('theme_clarico_vega.template_header_style_1')
        self.disable_view('theme_clarico_vega.template_header_style_2')
        self.disable_view('theme_clarico_vega.template_header_style_3')
        self.disable_view('theme_clarico_vega.footer_style_1')

        super(ThemeClaricoVega, self)._reset_default_config()
