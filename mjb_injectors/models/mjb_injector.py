# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import logging
from odoo import fields
from odoo import models, api, http

# import json

_logger = logging.getLogger(__name__)


class MJB_Injector(models.Model):
    _name = "mjb.injector"
    _description = "MJB Injector JS/XML/CSS"

    name = fields.Char('Name', required=True, select=1)
    description = fields.Char('Description')
    link = fields.Char('Link')

    js = fields.Text('Javascript', required=False, index=False, store=True)
    css = fields.Text('CSS', required=False, index=False, store=True)
    xml = fields.Text('XML', required=False, index=False, store=True)

    active = fields.Boolean('Active', default=True)
    groups = fields.Many2many('res.groups', 'groups_group_injector', 'group_injector_id', 'group_id',
                              track_visibility='onchange', string='Groups')

    _sql_constraints = [
        ('name_uniq', 'unique (name)',
         'The name of the Script available , You must change your script name or check the script code may available !!!')
    ]

    @api.model
    def get_current_user_static(self):

        user_group_ids = self.env.user.groups_id
        user_group_mjb_ids = []
        for user_group in user_group_ids:
            user_group_mjb_ids += user_group["mjb_injector"]

        output_javascripts = []
        output_css = []
        output_xml = []

        for user_group_mjb_item in user_group_mjb_ids:
            if user_group_mjb_item['js']:
                output_javascripts.append(user_group_mjb_item['js'])

            if user_group_mjb_item['css']:
                output_css.append(user_group_mjb_item['css'])

            if user_group_mjb_item['xml']:
                output_xml.append(user_group_mjb_item['xml'])

        return {
            "js": ";".join(output_javascripts),
            "css": "\n".join(output_css),
            "xml": output_xml
        }
