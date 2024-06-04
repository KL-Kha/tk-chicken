/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import DynamicSnippetCarousel from "@website/snippets/s_dynamic_snippet_carousel/000";
import wSaleUtils from "@website_sale/js/website_sale_utils";
import { markup } from "@odoo/owl";

const DynamicSnippetCategory = DynamicSnippetCarousel.extend({
    selector: '.s_dynamic_snippet_category',
    _getSelectedCategorySearchDomain() {
        const searchDomain = [];
        let productCategoryIds = this.$el.get(0).dataset.productCategoryIds;
        if (productCategoryIds && productCategoryIds != '[]') {
            searchDomain.push(['id', 'in', JSON.parse(productCategoryIds).map(productCategory => productCategory.id)]);
        }
        return searchDomain;
    },
    _getSearchDomain: function () {
        const searchDomain = this._super.apply(this, arguments);
        searchDomain.push(...this._getSelectedCategorySearchDomain());
        return searchDomain;
    },
    _getRpcParameters: function () {
       return {};
    },
    async _fetchData() {
        if (this._isConfigComplete()) {
            const nodeData = this.el.dataset;
            const data = {
                'count': this.$el.attr('data-count'),
            };
            const filterFragments = await this.rpc(
                '/website/snippet/filters',
                Object.assign({
                    'filter_id': parseInt(nodeData.filterId),
                    'template_key': nodeData.templateKey,
                    'limit': parseInt(nodeData.numberOfRecords),
                    'search_domain': this._getSearchDomain(),
                    'with_sample': this.editableMode,
                    'category_context': data,
                }, this._getRpcParameters())
            );
            this.data = filterFragments.map(markup);
        } else {
            this.data = [];
        }
    },
});

publicWidget.registry.dynamic_snippet_category = DynamicSnippetCategory;

export default DynamicSnippetCategory;
