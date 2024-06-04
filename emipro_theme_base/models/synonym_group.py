""" -*- coding: utf-8 -*-
"""

from odoo import fields, models, api
from odoo.exceptions import ValidationError


# pylint: disable=too-few-public-methods
class SynonymGroup(models.Model):
    """ Class to manage the synonyms that later use in advanced search
    """
    _name = "synonym.group"
    _description = "Synonym Group"
    _order = "id desc"

    name = fields.Char(
        string='Synonyms Group', required=True,
        help='Synonyms Group with comma separated keywords(Eg., Mobile, Smartphone, Cellphone)')
    website_id = fields.Many2one(string="Website", comodel_name="website",
                                 help="This group will only accessible for specified website. "
                                      "Accessible for all websites if not specified!")

    @api.constrains("name")
    def check_group_name(self):
        """ Constraint to restrict a user from inserting a synonym which is already a part of
        another existing synonym group.
        """
        for group in self:
            synonym_list = [v.strip() for v in group.name.split(',')]
            # Check for duplicate synonyms in the same group
            if len(set(synonym_list)) != len(synonym_list):
                exist = {synonym for synonym in synonym_list if synonym_list.count(synonym) > 1}
                raise ValidationError(f"You have entered {exist} multiple times."
                                      f"\nMake sure that each synonym is entered only once!")

            # Check for synonyms already existing in other groups
            groups = self.search([("id", "!=", group.id)])
            name_list = [name_part.lower().strip() for gname in groups.mapped('name') for name_part
                         in gname.split(',')]
            for synonym in synonym_list:
                if synonym.lower().strip() in name_list:
                    raise ValidationError(
                        f"Below synonym(s) already available in another group :\n {synonym}")
