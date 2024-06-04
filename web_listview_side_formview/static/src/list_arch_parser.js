/** @odoo-module */

import {archParseBoolean} from '@web/views/utils';

import {ListArchParser} from '@web/views/list/list_arch_parser';

import {patch} from '@web/core/utils/patch';

patch(ListArchParser.prototype, {
    parse(xmlDoc, models, modelName) {
        const result = super.parse(...arguments);
        result.splitView = archParseBoolean(xmlDoc.getAttribute('split_view') || '');
        return result
    }
})
