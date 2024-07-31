from odoo import api, fields, models


class XMjbStockCard(models.Model):
    _name = 'x_mjb_stock_card'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = 'Stock Card'
    _rec_name = 'x_name'
    _order = 'x_sequence asc, id asc'

    x_active = fields.Boolean(string='Active', default=True)
    x_name = fields.Char(sting='Name')
    x_company_id = fields.Many2one('res.company', string='Company ID')
    x_end_date = fields.Date(string='End Date')
    x_location_ids = fields.Many2many('stock.location', string='Location IDS')
    x_notes = fields.Text(string='Notes')
    x_sequence = fields.Integer(string='Sequence')
    x_start_date = fields.Date(string='Start Date')
    x_state = fields.Selection([
        ('draft', 'Draft'),
        ('posted', 'Posted')], string='State')
    x_stock_card_line_count = fields.Integer(string='Stock Card ID count', compute='_compute_x_stock_card_line_count')

    def _compute_x_stock_card_line_count(self):
        results = self.env['x_mjb_stock_card_line'].read_group([('x_stock_card_id', 'in', self.ids)], ['x_stock_card_id'], ['x_stock_card_id'])
        dic = {}
        for x in results:
            dic[x['x_stock_card_id'][0]] = x['x_stock_card_id_count']
        for record in self:
            record['x_stock_card_line_count'] = dic.get(record.id, 0)

    def action_open_x_stock_card_line(self):
        return {
            'name':'Lines',
            'view_mode':'tree,form',
            'res_model':'x_mjb_stock_card_line',
            'type':'ir.actions.act_window',
            'domain': [('x_stock_card_id', '=', self.id)],
            'target':'current',
            'context': {},
        }
