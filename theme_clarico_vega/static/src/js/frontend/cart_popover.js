/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";
import { _lt, _t } from "@web/core/l10n/translation";
var registry = publicWidget.registry;

publicWidget.registry.websiteSaleCartLinkEpt = publicWidget.Widget.extend({
    selector: '#top a[href$="/shop/cart"]:not(.js_change_lang), #top_menu a[href$="/shop/cart"]:not(.js_change_lang)',
    events: {
        'click': '_onClick',
    },
    start: function () {
        this.$el.popover({
            trigger: 'manual',
            animation: true,
            html: true,
            title: function () {
                return _t("My Cart");
            },
            container: 'body',
            placement: 'auto',
            template: '<div class="popover mycart-popover te_open" role="tooltip"><div class="tooltip-arrow"></div><h3 class="popover-header"></h3><div class="te_cross"></div><div class="popover-body"></div></div>'
        });
    },
    _onClick: async function (ev) {
        ev.preventDefault();
        let self = this;
        self._popoverRPC = await $.get('/shop/cart_popover').then(function (data) {
            const popover = Popover.getInstance(self.$el[0]);
            popover._config.content = data;
            popover.setContent(popover.getTipElement());
            $(".mycart-popover").addClass('te_open');
            $("#wrapwrap").addClass("te_overlay");
            $('header#top').css({'z-index':0});
            self.$el.popover("show");
           $(".te_clear_cart_popover").on('click', function(ev) {
                jsonrpc('/shop/clear_cart', {}).then(function (data) {
                    location.reload();
                    $(".my_cart_quantity").html('0');
                });
            });
        });
    },
});

$(document).mouseup(function (ev) {
    if ($(ev.target).closest(".mycart-popover").length === 0) {
         $(".mycart-popover").removeClass("te_open");
        $("#wrapwrap").removeClass("te_overlay");
        $('.mycart-popover').removeClass('show');
//        $('.mycart-popover').remove();
        $('header#top').css({'z-index': ''});
    }
});

$(document).on('click', '.te_cross', function() {
    $(".mycart-popover").removeClass("te_open");
    $("#wrapwrap").removeClass("te_overlay");
    $('.mycart-popover').removeClass('show');
//    $('.mycart-popover').remove();
    $('header#top').css({'z-index': ''});
    if ($(window).width() <= 768) {
        $('.mycart-popover').remove();
    }
});
/*==== clear cart ========*/
registry.clear_cart = publicWidget.Widget.extend({
        selector: '#wrapwrap , .mycart-popover',
        read_events: {
            'click .te_clear_cart': '_onClickClearCart',
        },
        _onClickClearCart: function (ev) {
            console.log('_onClickClearCart');
            ev.preventDefault();
            jsonrpc('/shop/clear_cart', {}).then(function(data){
                location.reload();
            });
        },
    });
