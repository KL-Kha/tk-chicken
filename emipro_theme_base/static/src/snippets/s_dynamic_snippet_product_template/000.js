/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import DynamicSnippetCarousel from "@website/snippets/s_dynamic_snippet_carousel/000";
import wSaleUtils from "@website_sale/js/website_sale_utils";
import { markup } from "@odoo/owl";

const DynamicSnippetProductTemplate = DynamicSnippetCarousel.extend({
    selector: '.s_dynamic_snippet_product_template',
    _getCategorySearchDomain() {
        const searchDomain = [];
        let productCategoryId = this.$el.get(0).dataset.productCategoryId;
        if (productCategoryId && productCategoryId !== 'all') {
            if (productCategoryId) {
                searchDomain.push(['public_categ_ids', 'child_of', parseInt(productCategoryId)]);
            }
        }
        return searchDomain;
    },
    _getBrandSearchDomain() {
        const searchDomain = [];
        let productBrandId = this.$el.get(0).dataset.productBrandId;
        if (productBrandId && productBrandId !== 'all') {
            if (productBrandId) {
                searchDomain.push(['product_brand_id', '=', parseInt(productBrandId)]);
            }
        }
        return searchDomain;
    },
    _getTagSearchDomain() {
        const searchDomain = [];
        let productTagIds = this.$el.get(0).dataset.productTagIds;
        if (productTagIds) {
            searchDomain.push(['product_variant_ids.all_product_tag_ids', 'in', JSON.parse(productTagIds).map(productTag => productTag.id)]);
        }
        return searchDomain;
    },
    getSelectedProductTemplateSearchDomain() {
        const searchDomain = [];
        let productTemplateIds = this.$el.get(0).dataset.productTemplateIds;
        if (productTemplateIds && productTemplateIds != '[]') {
            searchDomain.push(['id', 'in', JSON.parse(productTemplateIds).map(productTemplate => productTemplate.id)]);
        }
        return searchDomain;
    },
    _getSearchDomain: function () {
        const searchDomain = this._super.apply(this, arguments);
        searchDomain.push(...this.getSelectedProductTemplateSearchDomain());
        searchDomain.push(...this._getCategorySearchDomain());
        searchDomain.push(...this._getBrandSearchDomain());
        searchDomain.push(...this._getTagSearchDomain());
        return searchDomain;
    },
    _getRpcParameters: function () {
        const productTemplateId = $("#product_details").find(".product_template_id");
        return Object.assign(this._super.apply(this, arguments), {
            productTemplateId: productTemplateId && productTemplateId.length ? productTemplateId[0].value : undefined,
        });
    },
    async _fetchData() {
        if (this._isConfigComplete()) {
            const nodeData = this.el.dataset;
            const data = {
                'add2cart': this.$el.attr('data-add2cart'),
                'wishlist': this.$el.attr('data-wishlist'),
                'compare': this.$el.attr('data-compare'),
                'quickview': this.$el.attr('data-quickview'),
                'rating': this.$el.attr('data-rating'),
                'product_label': this.$el.attr('data-product_label'),
                'color_swatches': this.$el.attr('data-color_swatches'),
                'image_flipper': this.$el.attr('data-image_flipper'),
            };
            const filterFragments = await this.rpc(
                '/website/snippet/filters',
                Object.assign({
                    'filter_id': parseInt(nodeData.filterId),
                    'template_key': nodeData.templateKey,
                    'limit': parseInt(nodeData.numberOfRecords),
                    'search_domain': this._getSearchDomain(),
                    'with_sample': this.editableMode,
                    'product_context': data,
                }, this._getRpcParameters())
            );
            this.data = filterFragments.map(markup);
        } else {
            this.data = [];
        }
    },
});

publicWidget.registry.dynamic_snippet_product_template = DynamicSnippetProductTemplate;

export default DynamicSnippetProductTemplate;
