from odoo import api, fields, models


class XMjbStockCardLine(models.Model):
    _name = 'x_mjb_stock_card_line'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _description = '仓库报表'
    _rec_name = 'x_name'
    _order = 'x_sequence asc, id asc'

    x_active = fields.Boolean(string='Active', default=True)
    x_name = fields.Char(sting='Name')
    x_category_id = fields.Many2one('product.category', string='Category')
    x_company_id = fields.Many2one('res.company', string='Company ID')
    x_currency_id = fields.Many2one('res.currency', string='Currency')
    x_location_id = fields.Many2one('stock.location', string='Location')
    x_notes = fields.Text(string='Notes')
    x_product_id = fields.Many2one('product.product', string='Product')
    x_product_tmpl_id = fields.Many2one('product.template', string='Product Tmpl ID')
    x_qty_end = fields.Float(string='Qty End')
    x_qty_in = fields.Float(string='Qty In')
    x_qty_out = fields.Float(string='Qty Out')
    x_qty_start = fields.Float(string='Qty Start')
    x_qty_variation = fields.Float(string='Qty Variation')
    x_sequence = fields.Integer(string='Sequence')
    x_standard_cost = fields.Float(string='Standard Cost')
    x_state = fields.Selection([
        ('draft', 'Draft'),
        ('posted', 'Posted')], string='State')
    x_stock_card_id = fields.Many2one('x_mjb_stock_card', string='Stock Card ID')
    x_uom_id = fields.Many2one('uom.uom', string='UOM')
    x_val_end = fields.Float(string='Val End')
    x_val_in = fields.Float(string='Val In')
    x_val_out = fields.Float(string='Val Out')
    x_val_start = fields.Float(string='Val Start')
    x_val_variation = fields.Float(string='Val Variation')

