import logging
import jwt

from odoo.exceptions import AccessDenied

from odoo import api, models, registry, SUPERUSER_ID, fields
from odoo.http import request


class ResUsers(models.Model):
    _inherit = 'res.users'

    # login_token = fields.Char("Login Token", default=None)
    is_api_available = fields.Boolean(default = True)
    login_token_ids = fields.One2many(
        comodel_name="login.token", inverse_name="user_id")
    api_id_try = fields.Many2one(string = "API",comodel_name= "rest.api")
    api_ids = fields.Many2many(string = "API taken",compute = "get_api_ids",comodel_name= "rest.api")

    
    def get_api_ids(self):
        for rec in self:
            rec.api_ids = rec.login_token_ids.api_id.ids
            api_id = self.env['rest.api'].search([('id','not in', rec.api_ids.ids),('user_authenticate','=',True)])
            if api_id:
                rec.is_api_available = True
                rec.api_id_try = api_id[0]
            else:
                rec.is_api_available = False

    
    
    def generate_user_token(self):
        api_id = self.api_id_try.id
        user_id = self.id
        vals = {'user_id':user_id,'api_id':api_id}
        self.env['login.token'].sudo().create(vals)






