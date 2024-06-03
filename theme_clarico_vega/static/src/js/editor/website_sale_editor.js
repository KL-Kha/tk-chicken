/** @odoo-module **/

import options from "@web_editor/js/editor/snippets.options";
import { MediaDialog } from "@web_editor/components/media_dialog/media_dialog";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";
import "@website/js/editor/snippets.options";
import { renderToElement } from "@web/core/utils/render";

options.registry.WebsiteSaleProductsItem.include({
    async _colorStyle(){
        var btpClasses = { "bg-black": '#000000', "bg-white": '#FFFFFF', "bg-o-color-1": '#212529', "bg-o-color-2": '#685563', "bg-o-color-3": '#F6F6F6', "bg-o-color-4": '#FFFFFF', "bg-o-color-5": '#383E45', "bg-900": '#212529', "bg-800": '#343A40', "bg-600": '#6C757D', "bg-400": '#CED4DA', "bg-200": '#E9ECEF', "bg-100": '#F8F9FA', "bg-success": '#198754', "bg-info": '#0dcaf0', "bg-warning": '#ffc107', "bg-danger": '#dc3545'};
        for (var key in btpClasses) {
          if($(this.$ribbon).hasClass(key)){
             $(this.$ribbon).removeClass(key).css('background-color', btpClasses[key] + ' !important;');
          }
        }
    },

    async selectStyle(previewMode, widgetValue, params) {
        const proms = [this._super(...arguments)];
        if($(this.$ribbon).hasClass('o_product_label_style_4_left') || $(this.$ribbon).hasClass('o_product_label_style_4_right')){
            await this._colorStyle();
        }
        if (params.cssProperty === 'background-color' && params.colorNames.includes(widgetValue)) {
            // Reset text-color when choosing a background-color class, so it uses the automatic text-color of the class.
            proms.push(this.selectStyle(previewMode, '', {cssProperty: 'color'}));
        }
        await Promise.all(proms);
        if (!previewMode) {
            await this._saveRibbon();
        }
    },
    /* Override method */
    async setRibbonMode(previewMode, widgetValue, params) {
        const classList = this.$ribbon[0].classList;
        const cardProduct = $(this.$target).parents('#products_grid').find('.oe_product_image')
        this.$ribbon[0].className = this.$ribbon[0].className.replace(/o_(ribbon|tag|product_label_style_1|product_label_style_2|product_label_style_3|product_label_style_4|product_label_style_5)_(left|right)/, `o_${widgetValue}_$2`);
        const productStyle = $(this.$target).parents('#products_grid').find('.o_product_label_style_4_left, .o_product_label_style_4_right').parents('.oe_product_image')
        if (this.$ribbon[0].classList.contains('o_ribbon_left') || this.$ribbon[0].classList.contains('o_ribbon_right')){
            $(cardProduct).addClass('overflow-hidden');
            $(productStyle).removeClass('overflow-hidden');
        } else if (this.$ribbon[0].classList.contains('o_product_label_style_4_left') || this.$ribbon[0].classList.contains('o_product_label_style_4_right')){
            $(productStyle).removeClass('overflow-hidden');
            await this._colorStyle();
        }
        await this._saveRibbon();
    },

    async setRibbonPosition(previewMode, widgetValue, params) {
        this.$ribbon[0].className = this.$ribbon[0].className.replace(/o_(ribbon|tag|product_label_style_1|product_label_style_2|product_label_style_3|product_label_style_4|product_label_style_5)_(left|right)/, `o_$1_${widgetValue}`);
        await this._saveRibbon();
    },

    /* Override method */
    async _renderCustomXML(uiFragment) {
        const $select = $(uiFragment.querySelector('.o_wsale_ribbon_select'));
        this.ribbons = await new Promise(resolve => this.trigger_up('get_ribbons', {callback: resolve}));
        const classes = this.$ribbon[0].className;
        this.$ribbon[0].className = '';
        const defaultTextColor = window.getComputedStyle(this.$ribbon[0]).color;
        this.$ribbon[0].className = classes;
        Object.values(this.ribbons).forEach(ribbon => {
            const colorClasses = ribbon.html_class.split(' ').filter(className => !/^o_(ribbon|tag|product_label_style_1|product_label_style_2|product_label_style_3|product_label_style_4|product_label_style_5)_(left|right)$/.test(className)).join(' ');
            $select.append(renderToElement('website_sale.ribbonSelectItem', {
                ribbon,
                colorClasses,
                isTag: /o_tag_(left|right)/.test(ribbon.html_class),
                isLeft: /o_(tag|ribbon|product_label_style_1|product_label_style_2|product_label_style_3|product_label_style_4|product_label_style_5)_left/.test(ribbon.html_class),
                textColor: ribbon.text_color || (colorClasses ? 'currentColor' : defaultTextColor),
            }));
        });
    },
    /* Override method */
    async _computeWidgetState(methodName, params) {
        const classList = this.$ribbon[0].classList;
        switch (methodName) {
            case 'setRibbon':
                return this.$target.attr('data-ribbon-id') || '';
            case 'setRibbonHtml':
                return this.$ribbon.html();
            case 'setRibbonMode': {
                if (classList.contains('o_ribbon_left') || classList.contains('o_ribbon_right')) {
                    return 'ribbon';
                } else if (classList.contains('o_tag_left') || classList.contains('o_tag_right')){
                    return 'tag';
                } else if (classList.contains('o_product_label_style_1_left') || classList.contains('o_product_label_style_1_right')){
                    return 'product_label_style_1';
                } else if (classList.contains('o_product_label_style_2_left') || classList.contains('o_product_label_style_2_right')){
                    return 'product_label_style_2';
                } else if (classList.contains('o_product_label_style_3_left') || classList.contains('o_product_label_style_3_right')){
                    return 'product_label_style_3';
                } else if (classList.contains('o_product_label_style_4_left') || classList.contains('o_product_label_style_4_right')){
                    return 'product_label_style_4';
                } else if (classList.contains('o_product_label_style_5_left') || classList.contains('o_product_label_style_5_right')){
                    return 'product_label_style_5';
                }
            }
            case 'setRibbonPosition': {
                if (classList.contains('o_tag_left') || classList.contains('o_ribbon_left') || classList.contains('o_product_label_style_1_left') || classList.contains('o_product_label_style_2_left') || classList.contains('o_product_label_style_3_left') || classList.contains('o_product_label_style_4_left') || classList.contains('o_product_label_style_5_left')) {
                    return 'left';
                }
                return 'right';
            }
        }
        return this._super(methodName, params);
    },

    async _saveRibbon(isNewRibbon = false) {
        await this._super.apply(this, arguments);
    },

    async _setRibbon(ribbonId) {
        await this._super.apply(this, arguments);
        if(this.ribbons[ribbonId]){
            this.$ribbon.css({'color': this.ribbons[ribbonId].text_color + ' !important' || '', 'background-color': this.ribbons[ribbonId].bg_color + ' !important' || '', 'border-bottom-color': this.ribbons[ribbonId].bg_color + ' !important'  || '', 'border-left-color': this.ribbons[ribbonId].bg_color + ' !important' || '', 'border-top-color': this.ribbons[ribbonId].bg_color + ' !important' || ''});
        }
    },

});