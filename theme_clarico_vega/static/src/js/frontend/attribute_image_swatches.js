/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";

publicWidget.registry.AttributeColorPane = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: Object.assign({}, publicWidget.Widget.prototype.events, {
        'mouseenter .attribute_color': '_onMouseEnterSwatch',
        'mouseleave .attribute_color': '_onMouseLeaveSwatch',
        'mouseenter .oe_product_image_img_wrapper': '_onMouseEnterFlip',
        'mouseleave .oe_product_image_img_wrapper': '_onMouseLeaveSwatch',
    }),
    _onMouseEnterSwatch: async function(ev) {
        const $target = $(ev.currentTarget);
        var data = $target.data();
        var params = {
            'value_id': data.attributeValueId,
            'product_id': data.productId
        }
        var url;
        await jsonrpc('/hover/color', params).then((data) => {
            url = data && data.url;
        });
        url && $target.parents('.o_wsale_product_grid_wrapper, .o_carousel_product_card').find('.oe_product_image img, .o_img_product_cover').attr('src', url);
    },
    _onMouseEnterFlip: function(ev) {
        const $target = $(ev.currentTarget);
        var second_image = $target.find('img').attr('hover-image');
        if(second_image != '/web/image/product.image/product.image()/image_512' && second_image != '/web/image/product.image/product.image()/image_1920'){
            $target.find('img').attr('src', second_image);
        }
    },
    _onMouseLeaveSwatch: function(ev) {
        var target = $(ev.currentTarget).find('img').attr('data-src') || $(ev.currentTarget).attr('data-src');
        $(ev.currentTarget).find('img').attr('src', target);
        $(ev.currentTarget).parents('.o_wsale_product_grid_wrapper, .o_carousel_product_card').find('.oe_product_image img, .o_img_product_cover').attr('src', target);
    },
});
