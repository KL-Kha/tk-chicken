# -*- encoding: utf-8 -*-
import json
import ast
import logging
import base64
import requests
import random
import markdown2
import urllib
import hashlib
import hmac
import re
import io
import xmlrpc.client
import http.client
import socket
import sys
# import mariadb
import xmltodict
import yaml

from odoo import api, models, fields

_logger = logging.getLogger(__name__)


class ServerActions(models.Model):

    _inherit = 'ir.actions.server'
    _importedModules = []

    # ----------------------------------------------------------
    # Functions
    # ----------------------------------------------------------

    def _get_modules_list(self):
        return sys.modules
    
    def _dynamic_import(self, mod):
        modulesList = self._get_modules_list()

        if mod in modulesList:
            return sys.modules[mod]
        
        map(__import__, [mod])
        return sys.modules[mod]
    
    @api.model
    def _get_eval_context(self, action=None):
        eval_context = super(
            ServerActions, self)._get_eval_context(action=action)

        eval_context.update({
            '_dynamic_import': self._dynamic_import,
            'mb': {
                're': re,
                'json': json,
                'random': random,
                'markdown2': markdown2,
                'io': io,
                'hashlib': hashlib,
                'hmac': hmac,
                'urllib': urllib,
                'ast': ast,
                'requests': requests,
                'base64': base64,
                'xmlrpc.client': xmlrpc.client,
                'http.client': http.client,
                'socket': http.client,
		        # 'mariadb': mariadb,
            }
        })
        return eval_context
