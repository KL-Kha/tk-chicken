/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { jsonrpc } from "@web/core/network/rpc_service";
var registry = publicWidget.registry;

registry.QuickView = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click .quick-view-a': '_initQuickView',
        'click .ajax_cart_popup': '_initQuickView',
        'click .quick_close':'_quick_close',
        'keydown .o_searchbar_form .o_dropdown_menu a':'_onKeydown',
        'keydown .o_searchbar_form .o_dropdown_menu button':'_onKeydown',
        'click .te_srch_close_ept': '_onSearchClickCloseEpt',
    },
    _initQuickView: function(ev){
        ev.preventDefault()
        self = this;
        var element = ev.currentTarget;
        var product_id = $(element).attr('data-id');
        var params = {
            'product_id': product_id,
        }
        if (product_id){
            if($(ev.currentTarget).hasClass('quick-view-a')){
                $("#quick_view_model_shop .modal-body").addClass('quick_view_clicked');
            }
            jsonrpc('/quick_view_item_data', params).then((data) => {
                $("#quick_view_model .modal-body").html(data);
                $('#quick_view_model').modal('show');
                $('[data-bs-toggle="tooltip"]').tooltip({animation: true,delay: {show: 300,hide: 100} })
            });
        }
    },
    _quick_close: function(){
        $('#quick_view_model_shop, #quick_view_model, #quick_view_model_popup').modal('hide');
        $("#quick_view_model_shop .modal-body, #quick_view_model .modal-body").html('');
    },
    _onSearchClickCloseEpt:function(ev) {
        var params = new URLSearchParams(window.location.search);
        $('input[name="search"]').val('');
        const classExists = $('.te_searchform__body, .te_sub_search').length;
        if (classExists) {
            $('.te_srch_close_ept').css("display", "none");
        }
        else if (params.get('search')){
            $('button[type="submit"]').trigger('click');
        }
        else {
            $('.te_srch_close_ept').css("display", "none");
            $(".search_btn_close").trigger('click');
        }
    },
    _onKeydown: function(ev){
        switch (ev.key) {
            case "ArrowDown":
                ev.preventDefault();
                if ($('.o_searchbar_form .o_dropdown_menu') && ev.currentTarget) {
                    let $element = ev.currentTarget.nextElementSibling;
                    if($element == null){
                        $element = $('.categ_search').next();
                    }
                    $element.focus();
                }
                break;
            case "ArrowUp":
                ev.preventDefault();
                if($('.o_searchbar_form .o_dropdown_menu')){
                    let $element = ev.currentTarget.previousElementSibling;
                    if($('.categ_search').length != 0 && ev.currentTarget == $('.o_dropdown_menu').children()[1]){
                        $element = $('.categ_search a')[$('.categ_search a').length-1];
                    }
                    if($element !=null)
                        $element.focus();
                }
                break;
        }
    },
});
