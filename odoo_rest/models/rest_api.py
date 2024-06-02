# -*- coding: utf-8 -*-
##########################################################################
#
#    Copyright (c) 2015-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#
##########################################################################
from odoo import models, fields,_, api
from odoo.exceptions import UserError
import random
import string
import datetime
import logging
_logger = logging.getLogger(__name__)


def _default_unique_key(size, chars=string.ascii_uppercase + string.digits):
	return ''.join(random.choice(chars) for x in range(size))


class RestAPI(models.Model):
	_name = "rest.api"
	_description = "RESTful Web Services"

	def _default_unique_key(size, chars=string.ascii_uppercase + string.digits ):
		return ''.join(random.choice(chars) for x in range(size))

	@api.model
	def _check_permissions(self, model_name,user_id , context=None):
		response = {'success':True, 'message':'OK','permissions':{}}
		model_exists = self.env['ir.model'].sudo().search([('model','=',model_name)])
		if not model_exists:
			response['success'] = False
			response['responseCode'] = 401
			response['message'] = "Model(%s) doen`t exists !!!"%model_name
			return response
		elif self.availabilty == "all":
			response['success']= True
			response['responseCode'] = 200
			response['message'] = "Allowed %s Models Permission" % (model_exists.name)
			response['model_id'] = model_exists.id
			response['permissions'].update({'read':True,'write':True,'delete':True,'create':True})
		else:
			#Check for existense
			resource_allowed = self.env['rest.api.resources'].sudo().search([('api_id','=',self.id),('model_id','=',model_exists.id)])
			if resource_allowed:
				response['success'] = True
				response['responseCode'] = 200
				response['message'] = "Allowed %s Models Permission: %s" % (model_exists.name, self.availabilty)
				response['model_id'] = model_exists.id
				response['permissions'].update({'read': resource_allowed.read_ok, 'write': resource_allowed.write_ok, 'delete': resource_allowed.unlink_ok, 'create': resource_allowed.create_ok})
			else:
				response['success'] = False
				response['responseCode'] = 403
				response['message'] = "Sorry,you don`t have enough permission to access this Model(%s). Please consult with your Administrator."%model_name
				return response
		logging.info("==============================x5")
		if user_id != 1:
			list_access_rights_id = self.env['res.users'].browse(user_id).action_show_accesses().get('domain')[0][2]
			current_model_access_rights = self.env['ir.model.access'].search([('model_id.model','=',model_name),('id','in',list_access_rights_id)])
			read_perm = False
			write_perm = False
			create_perm = False
			unlink_perm = False
			for i in current_model_access_rights:
				logging.info(i)
				logging.info(i.name)
				read_perm = read_perm or i.perm_read
				write_perm = write_perm or i.perm_write
				create_perm = create_perm or i.perm_create
				unlink_perm = unlink_perm or i.perm_unlink
				
		# 	# current_model_access_rights = self.env['ir.model.access'].search([('model_id.name','=',model_name),('id','=',list_access_rights_id)])
		# 	test = self.env['ir.model.access'].browse(current_model_access_rights.ids[-1])
			response['permissions']['read'] = response['permissions']['read'] and read_perm
			response['permissions']['write'] = response['permissions']['write'] and write_perm
			response['permissions']['create'] = response['permissions']['create'] and create_perm
			response['permissions']['delete'] = response['permissions']['delete'] and unlink_perm
		
		
		return response

	@api.model
	def _validate(self, api_key, context=None):
		context = context or {}
		response = {'success':False, 'message':'Unknown Error !!!'}
		if not api_key:
			response['responseCode'] = 401
			response['message'] = 'Invalid/Missing Api Key !!!'
			return response
		try:
			# Get Conf
			Obj_exists = self.sudo().search([('api_key','=',api_key)])
			if not Obj_exists:
				response['responseCode'] = 401
				response['message'] = "API Key is invalid !!!"
			else:
				response['success'] = True
				response['responseCode'] = 200
				response['message'] = 'Login successfully.'
				response['confObj'] = Obj_exists
		except Exception as e:
			response['responseCode'] = 401
			response['message'] = "Login Failed: %r"%e.message or e.name
		return response

	name = fields.Char('Name', required=True)
	description = fields.Text('Extra Information', help="Quick description of the key", translate=True)
	# api_key = fields.Char(string='API Secret key', default=_default_unique_key(32), required=1)
	api_key = fields.Char(string='API Secret key')
	active = fields.Boolean(default=True)
	resource_ids = fields.One2many('rest.api.resources','api_id', string='Choose Resources')
	availabilty = fields.Selection([
        ('all', 'All Resources'),
        ('specific', 'Specific Resources')], 'Available for', default='all',
        help="Choose resources to be available for this key.", required=True)
	
	user_authenticate=fields.Boolean(string="User Authenticate",default=False)
	# user_ids=fields.Many2many(string="User Ids",comodel_name="res.users")
	user_ids_count=fields.Integer(compute="_count_user_ids")
	login_token_ids=fields.One2many(string="Login Token Ids", inverse_name="api_id", comodel_name="login.token")

	def generate_secret_key(self):
		self.api_key = _default_unique_key(32)

	# @api.one
	def copy(self, default=None):
		raise UserError(_("You can't duplicate this Configuration."))

	# @api.multi
	def unlink(self):
		raise UserError(_('You cannot delete this Configuration, but you can disable/In-active it.'))

	def _count_user_ids(self):
		for rec in self:
			rec.user_ids_count=len(rec.login_token_ids)
		return

	def action_show_users(self):
		self.ensure_one()
		return {
            'name': _('Login Tokens'),
            'view_mode': 'tree,form',
            'res_model': 'login.token',
            'type': 'ir.actions.act_window',
            'context': {'create': True, 'delete': False},
            'domain': [('id', 'in', self.login_token_ids.ids)],
            'target': 'new',
        }
