from odoo import models, fields, api, _
from odoo.exceptions import UserError
import json
import requests
from datetime import date, datetime, timedelta
import string
import random
def token_generator(size=32, chars=string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

class IZIDashboard(models.Model):
    _inherit = 'izi.dashboard'

    izi_lab_api_key = fields.Char('IZI Lab API Key', compute='_compute_izi_lab_api_key')
    izi_lab_url = fields.Char('IZI Lab URL', compute='_compute_izi_lab_api_key')
    base_url = fields.Char('Base URL', compute='_compute_izi_lab_api_key')
    izi_dashboard_access_token = fields.Char('IZI Dashboard Access Token', compute='_compute_izi_lab_api_key')

    def _compute_izi_lab_api_key(self):
        for rec in self:
            rec.izi_lab_api_key = self.env.user.company_id.izi_lab_api_key
            rec.izi_lab_url = self.env['ir.config_parameter'].sudo().get_param('izi_lab_url')
            rec.base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            rec.izi_dashboard_access_token = self.env['ir.config_parameter'].sudo().get_param('izi_dashboard.access_token')
    
    def action_get_lab_analysis_config(self, analysis_id, analysis_name):
        izi_lab_url = self.env['ir.config_parameter'].sudo().get_param('izi_lab_url')
        if not izi_lab_url:
            raise UserError(_('Please set IZI Lab URL in System Parameters.'))
        res = requests.post('''%s/lab/analysis/%s/config''' % (izi_lab_url, analysis_id), json={
            'name': analysis_name,
            'izi_lab_api_key': self.env.company.izi_lab_api_key,
        })
        res = res.json()
        if res.get('result') and res.get('result').get('config'):
            data = res.get('result').get('config')
            # Call izi.dashboard.config.wizard to create dashboard
            res = self.env['izi.dashboard.config.wizard'].create({
                'dashboard_id': self.id,
            }).process_wizard(data=data)
            if res.get('errors'):
                res = {
                    'message': res['errors'][0]['error'],
                    'status': 500,
                }
        else:
            res = res.get('result')
        return res

    def check_if_date_format(self, value):
        date_formats = ["%Y-%m-%d", "%Y-%m", "%Y"]
        res = False
        for date_format in date_formats:
            try:
                res = bool(datetime.strptime(value, date_format))
            except Exception as e:
                continue
        return res

    def check_if_datetime_format(self, value):
        datetime_format = "%Y-%m-%d %H:%M:%S"
        try:
            return bool(datetime.strptime(value, datetime_format))
        except Exception as e:
            return False

    def action_execute_code(self, query):
        result = {
            'status': 200,
            'id': '',
        }
        if query:
            analysis = self.env['izi.analysis'].search([('name', '=', 'Analysis Preview From AI')])
            analysis.unlink()
            table = self.env['izi.table'].search([('name', '=', 'Table Preview From AI')])
            table.unlink()
            source = self.env['izi.data.source'].search([], limit=1)

            query_value = {}
            query = query.replace(';', '')
            if 'LIMIT' in query:
                query_result = self.env['izi.tools'].query_fetch(query + ' ;')
                if query_result:
                    query_value = query_result[0]
            else:
                query_result = self.env['izi.tools'].query_fetch(query + ' LIMIT 1 ;')
                if query_result:
                    query_value = query_result[0]
            
            # Create Table
            table = self.env['izi.table'].create({
                'name': 'Table Preview From AI',
                'source_id': source.id,
                'is_query': True,
                'db_query': query,
            })
            table.get_table_fields()

            # Create Analysis
            analysis = self.env['izi.analysis'].create({
                'name': 'Analysis Preview From AI',
                'method': 'query',
                'table_id': table.id,
            })

            # Check Key in Query Value
            metric_fields = []
            dimension_fields = []
            date_fields = []
            metric_field_ids = []
            dimension_field_ids = []
            date_field_ids = []
            for key in query_value:
                value = query_value[key]
                type_origin = 'varchar'
                if type(value) == bool:
                    type_origin = 'boolean'
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if field:
                        dimension_field_ids.append(field.id)
                        dimension_fields.append(key)
                elif self.check_if_datetime_format(value) or isinstance(value, datetime):
                    type_origin = 'timestamp'
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if field:
                        date_field_ids.append(field.id)
                        date_fields.append(key)
                elif self.check_if_date_format(value) or isinstance(value, date):
                    type_origin = 'date'
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if field:
                        date_field_ids.append(field.id)
                        date_fields.append(key)
                elif isinstance(value, int) and 'year' not in key: 
                    type_origin = 'int4'
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if key == 'sum':
                        field.name = 'value_' + str(len(metric_fields) + 1)
                    if field:
                        metric_field_ids.append(field.id)
                        metric_fields.append(key)
                elif isinstance(value, float) and 'year' not in key:
                    type_origin = 'float8'
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if key == 'sum':
                        field.name = 'value_' + str(len(metric_fields) + 1)
                    if field:
                        metric_field_ids.append(field.id)
                        metric_fields.append(key)
                else:
                    field = self.env['izi.table.field'].search([('field_name', '=', key), ('table_id', '=', table.id)], limit=1)
                    if field:
                        dimension_field_ids.append(field.id)
                        dimension_fields.append(key)
            
            # Visual Type
            visual_type_name = 'scrcard_basic'
            if len(metric_fields) and len(date_fields):
                visual_type_name = 'line'
            if len(metric_fields) and len(dimension_fields):
                visual_type_name = 'bar'
            if len(metric_fields) == 2 and len(dimension_fields) == 0 and len(date_fields) == 0:
                visual_type_name = 'scatter'
            visual_type = self.env['izi.visual.type'].search([('name', '=', visual_type_name)], limit=1)
            analysis.visual_type_id = visual_type.id

            # Metric & Dimension
            for field_id in dimension_field_ids:
                dimension = self.env['izi.analysis.dimension'].create({
                    'field_id': field_id,
                    'analysis_id': analysis.id,
                })
            for field_id in date_field_ids:
                dimension = self.env['izi.analysis.dimension'].create({
                    'field_id': field_id,
                    'field_format': 'day',
                    'analysis_id': analysis.id,
                })
            if date_field_ids:
                sort = self.env['izi.analysis.sort'].create({
                    'field_id': date_field_ids[0],
                    'sort': 'asc',
                    'analysis_id': analysis.id,
                })
            elif metric_field_ids:
                sort = self.env['izi.analysis.sort'].create({
                    'field_id': metric_field_ids[0],
                    'sort': 'desc',
                    'analysis_id': analysis.id,
                })
            analysis.metric_ids.unlink()
            for field_id in metric_field_ids:
                metric = self.env['izi.analysis.metric'].create({
                    'field_id': field_id,
                    'calculation': 'sum',
                    'analysis_id': analysis.id,
                })
            result['id'] = analysis.id
        return result

    def action_get_lab_ask(self, messages):
        result = {
            'status': 200,
            'new_messages': '',
        }
        izi_lab_url = self.env['ir.config_parameter'].sudo().get_param('izi_lab_url')
        if not izi_lab_url:
            raise UserError(_('Please set IZI Lab URL in System Parameters.'))
        if messages:
            try:
                res = requests.post('''%s/lab/analysis/ask''' % (izi_lab_url), json={
                    'izi_lab_api_key': self.env.company.izi_lab_api_key,
                    'messages': messages,
                }, timeout=120)
                res = res.json()
                if res.get('result') and res.get('result').get('status') == 200 and res.get('result').get('new_message_content'):
                    new_message_content = res.get('result').get('new_message_content')
                    if new_message_content:
                        if '# START_CODE' in new_message_content and '# END_CODE' in new_message_content:
                            new_message_content = new_message_content.replace('# START_CODE_SQL\n', '<div class="code_content code_content_sql">')
                            new_message_content = new_message_content.replace('# START_CODE_SQL', '<div class="code_content code_content_sql">')
                            new_message_content = new_message_content.replace('# START_CODE_PYTHON\n', '<div class="code_content code_content_python">')
                            new_message_content = new_message_content.replace('# START_CODE_PYTHON', '<div class="code_content code_content_python">')
                            new_message_content = new_message_content.replace('# START_CODE\n', '<div class="code_content">')
                            new_message_content = new_message_content.replace('# START_CODE', '<div class="code_content">')
                            new_message_content = new_message_content.replace('# END_CODE_SQL', '<div class="code_execution"><span class="material-icons">play_arrow</span></div></div>')
                            new_message_content = new_message_content.replace('# END_CODE_PYTHON', '</div>')
                            new_message_content = new_message_content.replace('# END_CODE', '</div>')
                    result['new_message_content'] = new_message_content
                elif res.get('result') and res.get('result').get('status') and res.get('result').get('status') != 200:
                    result = {
                        'status': res.get('result').get('status'),
                        'message': res.get('result').get('message') or '',
                    }
            except Exception as e:
                pass
        return result
    
    def generate_access_token(self):
        token = self.env['izi.dashboard.token'].sudo().create({
            'name': 'Dashboard Access Token',
            'token': token_generator(),
            'is_active': True,
            'dashboard_id': int(self.id),
            'expired_date': fields.Datetime.now() + timedelta(hours=1),
        })
        return token.token
    
class IZIDashboardToken(models.Model):
    _name = 'izi.dashboard.token'
    _description = 'IZI Dashboard Token'

    name = fields.Char('Name')
    token = fields.Char('Token')
    dashboard_id = fields.Many2one('izi.dashboard', 'Dashboard')
    user_id = fields.Many2one('res.users', 'User')
    is_active = fields.Boolean('Active', default=True)
    expired_date = fields.Datetime('Expired Date')
    