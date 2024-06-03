from odoo import models, fields, api
from odoo.http import request

class ResUsers(models.Model):
    _inherit = "res.users"

    dark_mode = fields.Boolean('Dark Mode')


    def button_dark_mode(self):
        request.future_response.set_cookie('color_scheme', value='dark')
        self.dark_mode = True
        if self.id == self.env.uid:
            return {
                'type': 'ir.actions.client',
                'tag': 'reload',
            }
    
    def button_light_mode(self):
        request.future_response.set_cookie('color_scheme', max_age=0)
        self.dark_mode = False
        if self.id == self.env.uid:
            return {
                'type': 'ir.actions.client',
                'tag': 'reload',
            }
