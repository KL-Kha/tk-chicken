/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";
var registry = publicWidget.registry;
import { _lt, _t } from "@web/core/l10n/translation";

registry.SimilarProductView = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click .te_similar_view': '_initSimilarProductView',
    },
    start: function () {
        this.$el.popover({
            trigger: 'manual',
            animation: true,
            html: true,
            title: function () {
                return _t("You may also like this products");
            },
            container: 'body',
            placement: 'auto',
            template: '<div class="popover similar-product-popover mycart-popover te_open" role="tooltip"><div class="tooltip-arrow"></div><h3 class="popover-header"></h3><div class="te_cross"></div><div class="popover-body"></div></div>'
        });
    },
    _initSimilarProductView: async function (ev) {
        ev.preventDefault()
        self = this;
        var element = ev.currentTarget;
        var product_id = $(element).attr('data-id');
        var params = {
            'product_id': product_id,
        }
        self._popoverRPC = await $.get('/similar_products_item_data', params).then(function (data) {
            const popover = Popover.getInstance(self.$el[0]);
            popover._config.content = data;
            popover.setContent(popover.getTipElement());
            $(".similar-product-popover").addClass('show');
            $("#wrapwrap").addClass("te_overlay");
            $('header#top').css({'z-index':0});
            self.$el.popover("show");
        });
    }
});