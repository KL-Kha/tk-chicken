from odoo import models, fields, _, api
from odoo.exceptions import UserError
import random
import string
import jwt
import datetime
import logging
_logger = logging.getLogger(__name__)


class LoginToken(models.Model):
    _name = "login.token"
    _description = "Login Token"

    def user_id_domain(self):
        _logger.info('============= context ===%r=======', self.env.context)
        return []
    

    login_token_compute = fields.Char("Login Token " , compute="get_token", readonly=True, default="")
    login_token = fields.Char("Login Token", readonly=True)
    api_id = fields.Many2one(string="API ID", comodel_name="rest.api")
    user_id = fields.Many2one(string="USER ID", comodel_name="res.users", domain=user_id_domain)
    

    def get_token(self):
        for rec in self:
            if rec.api_id and rec.user_id:
                token = {"login": rec.user_id.login, "uid": rec.user_id.id }
                rec.login_token_compute = jwt.encode(token,rec.api_id.api_key , algorithm="HS256")
            else:
                rec.login_token_compute=""
            
            rec.login_token= rec.login_token_compute

    @api.model
    def create(self, vals):
        id = self.env['login.token'].search([('api_id','=',vals['api_id']),('user_id','=',vals['user_id'])])
        
        if id:
            raise UserError("token already generated for this api key")
        else:
            res = super(LoginToken,self).create(vals)
            return res
    

    def delete_user_token(self):
        self.unlink()
           

    


   
