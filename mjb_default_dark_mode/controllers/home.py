# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.addons.web.controllers.home import Home as WebHome
from odoo.http import request


class Home(WebHome):

    def _login_redirect(self, uid, redirect=None):
        dark_mode = request.env['res.users'].browse(uid).dark_mode
        if dark_mode: 
            request.future_response.set_cookie('color_scheme', value='dark')
        return super()._login_redirect(uid, redirect=redirect)
