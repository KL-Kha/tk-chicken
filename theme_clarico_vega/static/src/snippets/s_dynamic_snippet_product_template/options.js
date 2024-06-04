/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import s_dynamic_snippet_carousel_options from "@website/snippets/s_dynamic_snippet_carousel/options";
import wUtils from "@website/js/utils";

const dynamicSnippetProductTemplateOptions = s_dynamic_snippet_carousel_options.extend({
    init: function () {
        this._super.apply(this, arguments);
        this.modelNameFilter = 'product.template';
        this.productCategories = {};
        this.orm = this.bindService("orm");
    },
    _computeWidgetVisibility(widgetName, params) {
        return this._super(...arguments);
    },
    _fetchProductTemplateCategories: function () {
        return this.orm.searchRead("product.public.category", wUtils.websiteDomain(this), ["id", "name"]);
    },
    _fetchProductTemplateBrand: function () {
        return this.orm.searchRead("product.brand", wUtils.websiteDomain(this), ["id", "name"]);
    },
    _renderCustomXML: async function (uiFragment) {
        await this._super.apply(this, arguments);
        await this._renderProductTemplateCategorySelector(uiFragment);
        await this._renderBrandTemplateSelector(uiFragment);
    },
    _renderProductTemplateCategorySelector: async function (uiFragment) {
        const productCategories = await this._fetchProductTemplateCategories();
        for (let index in productCategories) {
            this.productCategories[productCategories[index].id] = productCategories[index];
        }
        const productCategoriesSelectorEl = uiFragment.querySelector('[data-name="product_category_opt"]');
        return this._renderSelectUserValueWidgetButtons(productCategoriesSelectorEl, this.productCategories);
    },
    _renderBrandTemplateSelector: async function (uiFragment) {
        this.productBrands = {}
        const productBrands = await this._fetchProductTemplateBrand();
        for (let index in productBrands) {
            this.productBrands[productBrands[index].id] = productBrands[index];
        }
        const productBrandsSelectorEl = uiFragment.querySelector('[data-name="product_brand_opt"]');
        return this._renderSelectUserValueWidgetButtons(productBrandsSelectorEl, this.productBrands);
    },
    _setOptionsDefaultValues: function () {
        this._setOptionValue('productCategoryId', 'all');
        this._setOptionValue('productBrandId', 'all');
        this._setOptionValue('add2cart', true);
        this._setOptionValue('wishlist', true);
        this._setOptionValue('compare', true);
        this._setOptionValue('quickview', true);
        this._setOptionValue('rating', true);
        this._setOptionValue('product_label', true);
        this._setOptionValue('color_swatches', true);
        this._setOptionValue('image_flipper', true);
        this._super.apply(this, arguments);
    },
});

options.registry.dynamic_snippet_product_template = dynamicSnippetProductTemplateOptions;

export default dynamicSnippetProductTemplateOptions;
