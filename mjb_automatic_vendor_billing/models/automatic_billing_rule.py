import datetime
from datetime import timedelta
from dateutil.relativedelta import relativedelta
import calendar
from itertools import groupby
from odoo import models, fields, api
from odoo.tools.float_utils import float_is_zero

class AutomaticBillingRuleEngine(models.Model):
    _name = 'automatic.billing.rule.engine'
    _description = 'Automatic Billing Rule Engine'
    _inherit = ['mail.thread', 'mail.activity.mixin', 'utm.mixin']
    _rec_name = "x_name"

    x_name = fields.Char(string="Name Automated Report Rule",default="Automated Report Rule")
    x_active = fields.Boolean(string="Active Rule",default=True)
    x_boolean_start_stop_action = fields.Boolean(string="Start/Stop",default=False)
    x_model_id = fields.Many2one('ir.model', string='Model', help='Select a model that you want to Automated Billing Rule the fields of.', default=lambda self: self.env.ref('purchase.model_purchase_order_line',raise_if_not_found=False))
    x_model_selection = fields.Selection(selection='_list_all_models', string='Model', help='Select a model that you want to Automated Report the fields of.')
    x_domain_filter = fields.Text(
        string='Domain',
        help="Enter a domain expression to select the records that you want to Automated Report the field of. Ex: [('field','comparison',condition)]",
        default='[]'
    )
    x_cron_id = fields.Many2one('ir.cron', string='Scheduled Action', domain=[('active', 'in', (True, False))], help='Scheduled action that will execute the Automated Vendor Billing Rule.',track_visibility='onchange')

    x_base_automation_id = fields.Many2one('base.automation', string='Automated Actions', domain=[('active', 'in', (True, False))], help='Automated Actions that will execute the Automated Vendor Billing Rule.',track_visibility='onchange')

    x_state = fields.Selection(
        string='State',
        selection=[
            ('draft','New'),
            ('running', 'Running'),
            ('stopped', 'Stopped'),
        ],
        default='draft',
        help='Current state of the Automated Report Rule.'
    )

    x_engine_type = fields.Selection(
        string='Engine Type',
        selection=[
            ('vendor','Vendor'),
            ('partner', 'Partner'),
        ], help="'Vendor' is using for PO and 'Partner' is using for SO billing."
    )

    x_period = fields.Selection([
        ('on_receive', 'Whenever delivery are received'),
        ('end_of_day', 'End of Day'),
        ('end_of_week', 'End of Week'),
        ('end_of_month', 'End of Month'),
        ('custom', 'Custom'),
    ],string="Period" ,default='on_receive')

    x_interval_number = fields.Integer(string='Custom Period Number',default=1)
    x_interval_type = fields.Selection([
        ('hours', 'Hours'),
        ('days', 'Days'),
        ('weeks', 'Weeks'),
        ('months', 'Months'),
    ], string='Custom Period Unit', default='days')

    x_group_bill = fields.Boolean(string='Group Bill')

    @api.model
    def _list_all_models(self):
        self._cr.execute("SELECT model, name FROM ir_model ORDER BY name")
        return self._cr.fetchall()

    @api.onchange('x_model_id')
    def _onchange_x_model_id(self):
        self.x_model_selection = self.x_model_id.model

    def _get_end_day_of_month(self,year):
        today = datetime.date.today()
        day_end_of_month = calendar.monthrange(2024, today.month)[1]

        return day_end_of_month
    
    def _get_current_domain(self):
        domain = eval(self.x_domain_filter or '[]')
        return domain

    def not_float_is_zero(self,qty_to_invoice,precision):
        if not float_is_zero(qty_to_invoice, precision_digits=precision):
            return True
        return False
    def itertools_group(self,invoice_vals_list):
        return groupby(invoice_vals_list, key=lambda x: (x.get('company_id'), x.get('partner_id'), x.get('currency_id')))