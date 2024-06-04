/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import s_dynamic_snippet_carousel_options from "@website/snippets/s_dynamic_snippet_carousel/options";
import wUtils from "@website/js/utils";

const dynamicSnippetBrandOptions = s_dynamic_snippet_carousel_options.extend({
    init: function () {
        this._super.apply(this, arguments);
        this.modelNameFilter = 'product.brand';
        this.productCategories = {};
        this.orm = this.bindService("orm");
    },
    _computeWidgetVisibility(widgetName, params) {
        return this._super(...arguments);
    },
    _fetchProductCategories: function () {
        return this.orm.searchRead("product.brand", wUtils.websiteDomain(this), ["id", "name"]);

    },
    _renderCustomXML: async function (uiFragment) {
        await this._super.apply(this, arguments);
        await this._renderProductBrandSelector(uiFragment);
    },
    _renderProductBrandSelector: async function (uiFragment) {
        const productCategories = await this._fetchProductCategories();
        for (let index in productCategories) {
            this.productCategories[productCategories[index].id] = productCategories[index];
        }
        const productCategoriesSelectorEl = uiFragment.querySelector('[data-name="product_brand_opt"]');
        return this._renderSelectUserValueWidgetButtons(productCategoriesSelectorEl, this.productCategories);
    },
    _setOptionsDefaultValues: function () {
        this._setOptionValue('count', true);
        this._super.apply(this, arguments);
    },
});

options.registry.dynamic_snippet_brand = dynamicSnippetBrandOptions;

export default dynamicSnippetBrandOptions;
