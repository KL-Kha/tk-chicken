/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import {DynamicSnippet} from '@website/snippets/s_dynamic_snippet/000';
import animations from "@website/js/content/snippets.animation";
import { jsonrpc } from "@web/core/network/rpc_service";
import OwlMixin from "@theme_clarico_vega/js/frontend/mixins";
import '@website_sale_wishlist/js/website_sale_wishlist';
import { OptionalProductsModal } from "@website_sale_product_configurator/js/sale_product_configurator_modal";


var registry = publicWidget.registry;
var dynamic_snippet = registry.dynamic_snippet;

registry.Lazyload = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    start() {
        if ($('#id_lazyload').length) {
            $("img.lazyload").lazyload();
        }
        this._super.apply(this, arguments);
    },
});
registry.productTabs = publicWidget.Widget.extend({
    selector: '.product_tabs_ept',
    start: function() {
        var self = this;
        var divLength = $('#nav-tab button').length;
        for(var i=0;i<=divLength-1;i++){
            var selectDesktopTab = $('#nav-tab button')[i].id;
            var selectMobileTab = $('#prd-tab-content .tab-pane')[i].id;
            var selectDesktopDynamicIcon;
            var selectDesktopDynamicName;
            if ($('#'+selectDesktopTab +' ' +'a > span').length) {
                if ($('#'+selectDesktopTab +' ' +'a > span')[0].classList.contains('fa')) {
                    selectDesktopDynamicIcon = $('#nav-tab #'+selectDesktopTab +' ' +'a > span')[0].className;
                    selectDesktopDynamicName = $('#nav-tab #'+selectDesktopTab +' ' +'a > span')[1].innerText;
                    $('#prd-tab-content #'+ selectMobileTab +' ' + 'a > span')[1].innerText = selectDesktopDynamicName;
                    $('#prd-tab-content #'+ selectMobileTab +' ' + 'a > span')[0].className = selectDesktopDynamicIcon;
                } else{
                    selectDesktopDynamicIcon = $('#'+selectDesktopTab +' ' +'a > span span')[0].className;
                    $('#prd-tab-content #'+ selectMobileTab +' ' + 'a > span')[0].className = selectDesktopDynamicIcon;
                }
            }
        }
    }
});
dynamic_snippet && dynamic_snippet.include({
    _renderContent: function () {
        this._super.apply(this, arguments);

        $('.s_product_brand_style_3 .dynamic-owl-carousel').each(function(index){
            var $items = $(this);
            var item = $items.attr('data-slide-size') || 1;
            var responsive = { 0: {items: 2}, 576: {items: 3}, 991: {items: 1}, 1200: {items: 1} };
            OwlMixin.initOwlCarousel('.s_product_brand_style_3 .dynamic-owl-carousel', 15, responsive, true, 1, false, true, false, false, false, false, true, false);
        });
        const $templateArea = this.$el.find('.dynamic_snippet_template');
        this._super.apply(this, arguments);
        if ($templateArea.find('img.lazyload')){
            $("img.lazyload").lazyload();
        }

        var interval = parseInt(this.$target[0].dataset.carouselInterval);
        var mobile_element_count = this.$target[0].dataset.numberOfElementsSmallDevices;
        $('.dynamic-owl-carousel').each(function(index) {
            var owl_rtl = false;
            if ($('#wrapwrap').hasClass('o_rtl')) {
                owl_rtl = true;
            }
            var $items = $(this);
            var item = $items.attr('data-slide-size') || 1;
            var slider_len = $items.find(".item").length == 0 ? $items.find(".card").length : $items.find(".item").length;
            var getItemLength = slider_len > 4 ? true : false;
            var margin = $items.parents('.s_product_public_category_style_3').length?0 : 15 ;
            var dots = $items.parents('.dynamic_columns_snippet').length ? true : false;
            if(slider_len > item){
                getItemLength = true;
            }
            $items.owlCarousel({
                loop: getItemLength,
                margin: margin,
                nav: true,
                navText : ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
                autoplay: true,
                autoplayTimeout: interval,
                autoplayHoverPause:true,
                items: item,
                dots: dots,
                rtl: owl_rtl,
                responsive: {
                    0: { items: mobile_element_count == undefined ? 1 : parseInt(mobile_element_count)},
                    576: { items: item > 1 ? 2 : item },
                    991: { items: item > 1 ? item - 1 : item },
                    1200: { items: item },
                },
            });
            if( $items.find('.owl-nav').hasClass('disabled')){
                if(slider_len > item){
                    $items.find('.owl-nav').show();
                }
            }
            if($items.parents('.s_product_template_style_4')){
                $items.find('.owl-dots').show();
            }
        });
        $("img.lazyload").lazyload();
    },
});
$(document).ready(function($) {
    /* Full Screen Slider 4 animation on mouse hover */
    var lFollowX = 0,
        lFollowY = 0,
        x = 0,
        y = 0,
        friction = 1 / 30;

    function moveBackground(e) {
        x += (lFollowX - x) * friction;
        y += (lFollowY - y) * friction;
        var translate = 'translate(' + x + 'px, ' + y + 'px) scale(1.1)';
        $('.te_s14_img').css({ '-webit-transform': translate, '-moz-transform': translate, 'transform': translate });
        window.requestAnimationFrame(moveBackground);
    }

    $(window).on('mousemove click', function(e) {
        var lMouseX = Math.max(-100, Math.min(100, $(window).width() / 2 - e.clientX));
        var lMouseY = Math.max(-100, Math.min(100, $(window).height() / 2 - e.clientY));
        lFollowX = (20 * lMouseX) / 100;
        lFollowY = (10 * lMouseY) / 100;
    });
    moveBackground();

     /* Full Banner With owl Slider */
    $('.te_banner_slider_content').each(function(index){
        var responsive = { 0: {items: 1}, 576: {items: 1} };
        OwlMixin.initOwlCarousel('.te_banner_slider_content', 10, responsive, true, 1, false, true, false, false, false, false, true, false);
    });
});
registry.SeeAllProcess = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    read_events: {
        'click .see_all_attr_btn': '_get_see_all_data',
        'click div.te_s_attr_color': '_filter_color_attribute_click',
    },
    _get_see_all_data: function(ev) {
        const $target = $(ev.currentTarget);
        var attr_id = $target.attr('attr-id');
        var is_mobile = $target.attr('is-mobile');
        var is_tag = $target.attr('is-tag');
        var params = {'attr_id': attr_id, 'is_mobile': is_mobile, 'is_tag': is_tag};

        jsonrpc('/see_all', params).then(function (data) {
            if(is_tag == 'True'){
                $('#o_wsale_attr_accordion2_tags').html(data);
                $('#o_wsale_offcanvas_tags').html(data);
            }
            else if(typeof(attr_id) == 'undefined' || attr_id == '0'){
                if(is_mobile == 'True'){
                    $('#o_wsale_offcanvas_attribute_0').html(data);
                }
                else{
                    $('#o_products_attributes_0').html(data);
                }
                $('.see_all_attr_0').hide()
            }
            else{
                if(is_mobile == 'True'){
                    $('#o_wsale_offcanvas_attribute_'+attr_id).html(data);
                }
                else{
                    $('#o_products_attributes_'+attr_id).html(data);
                }
                $('.see_all_attr_'+attr_id).hide()
            }
        });

    },

    /*======= color attribute click=========== */
    _filter_color_attribute_click: function(ev){
        $(ev.target).find('.css_attribute_color').trigger('click');
        if(ev.target.classList.contains('te_color-name')){
            $(ev.target).prev().trigger('click');
        }
    },
});
//function for manage live chat button
function chatBtn(btnHeight, cookie_height) {
    if (cookie_height) {
        $('.openerp.o_livechat_button').css({ 'bottom': cookie_height + 'px' });
    } else {
        $('.openerp.o_livechat_button').css({ 'bottom': '0px' });
    }
}
//  Sticky product details
//function for manage sticky add to cart with live chat button
function stickyMobileDevice(fixIconHeaderStyle, btnHeight, cookie_height) {
    var pwa_bar = $('.ios-prompt').height();
    setTimeout(function() {
        if ($('.ios-prompt').is(':visible')) {
            var btnHeight = (pwa_bar + btnHeight + 30);
            var cookie_height = (pwa_bar + cookie_height + 30);
        }
    }, 8000);
    if( $(fixIconHeaderStyle).length ){
        $('div#wrapwrap .product_details_sticky').css({'display':'block', 'position':'fixed', 'bottom': fixIconHeaderStyle+'px', 'top':'initial'});
        $('.openerp.o_livechat_button').css({'bottom': (fixIconHeaderStyle + btnHeight) +'px'});
    } else {
        $('div#wrapwrap .product_details_sticky').css({ 'display': 'block', 'position': 'fixed', 'bottom': cookie_height + 'px', 'top': 'initial' });
        $('.openerp.o_livechat_button').css({ 'bottom': btnHeight + 'px' });
    }
}
animations.registry.StickyGallery = animations.Animation.extend({
    selector: '#wrapwrap',
    effects: [{
        startEvents: 'scroll',
        update: '_stickyDetails',
    }],
    _stickyDetails: function(scroll) {
        // Sticky add to cart bar
        if ($('.product_details_sticky').length) {
            if ($('div#product_details a#add_to_cart').length) {
                var getPriceHtml = $('div#product_details .product_price').html();
                var stickHeight = $('.product_details_sticky .prod_details_sticky_div').height();
                var btnHeight = $('div#wrapwrap .product_details_sticky').height();
                var cookie_height = 0;
                if ($('.o_cookies_discrete .s_popup_size_full').length) {
                    cookie_height = $('.s_popup_size_full .modal-content').height()
                    stickHeight = cookie_height + stickHeight
                }
                var footerPosition = $("main").height() - $("#footer").height();
                var fixIconHeaderStyle = $('.mobile_header_component-style-1').height();
                var productDetails = $('#product_details').height() - $('#o_product_terms_and_share').height();
                if (scroll > productDetails && scroll < footerPosition - 500) {
                    if ($(window).width() >= 768) {
                        $('div#wrapwrap .product_details_sticky').css('bottom', cookie_height + 'px').fadeIn();
                        $('.o_product_feature_panel').css({'bottom': fixIconHeaderStyle + $('.product_details_sticky').height()}).fadeIn();
                    }
                    /* Display prices on add to cart sticky*/
                    if ($(".js_product.js_main_product").hasClass("css_not_available")) {
                        $('div#wrapwrap .prod_price').html('');
                    } else {
                        $('div#wrapwrap .prod_price').html(getPriceHtml);
                    }
                    /* Ipad view only */
                    if ($(window).width() >= 768 && $(window).width() <= 991) {
                        stickyMobileDevice(fixIconHeaderStyle, btnHeight, cookie_height);
                    }
                } else {
                    if ($(window).width() >= 768) {
                        $('.o_product_feature_panel').css({'bottom':0});
                        $('div#wrapwrap .product_details_sticky').css('bottom', cookie_height + 'px').fadeOut();
                    }
                    if ($(window).width() >= 768 && $(window).width() <= 991) {
                        chatBtn(fixIconHeaderStyle, btnHeight, cookie_height);
                    }
                }
                /* Mobile view sticky add to cart */
                if ($(window).width() <= 767) {
                    var relativeBtn = $('main').height() + $('header').height();
                    if(scroll < relativeBtn){
                        $('#add_to_cart_wrap .js_check_product, .o_we_buy_now').css('display','none');
                        stickyMobileDevice(fixIconHeaderStyle, btnHeight, cookie_height);
                        if($('.o_cookies_discrete').length != 0){
                             $('.o_cookies_discrete .s_popup_size_full .oe_structure').css({'bottom':$('.product_details_sticky').height()});
                        }
                    }
                    else{
                        $('div#wrapwrap .product_details_sticky').fadeOut();
                        $('.o_cookies_discrete .s_popup_size_full .oe_structure').css({'bottom':0});
                        chatBtn(fixIconHeaderStyle, btnHeight, cookie_height);
                    }
                }
            }
        }
    },
});
registry.brandPage = publicWidget.Widget.extend(OwlMixin, {
    selector: ".featured-all-brands",
    read_events: {
        'click .has-brands': '_onClickAlpha',
        'click #all-brands': '_showAllBrands',
        'keyup #search_box': '_onKeyupInput'
    },
    _onClickAlpha: function(ev) {
        this.showAllBrands();
        var $this = $(ev.currentTarget);
        var value = $('#search_box').val();
        $this.children().toggleClass('selected');
        var selected_letter_arr = []
        $('.selected').each(function(i) {
            selected_letter_arr.push($.trim($(this).text()))
        });
        if ($.inArray("0-9", selected_letter_arr) != -1){
            selected_letter_arr.push('1', '2', '3', '4', '5', '6', '7', '8', '9');
        }
        $('.brand-alpha-main').each(function(e) {
            var first_letter = $(this).find('.brand-name').text().substring(0, 1).toLowerCase();
            if ($.inArray(first_letter, selected_letter_arr) == -1 & selected_letter_arr.length != 0) {
                $(this).addClass('d-none');
            }
        });
        if (value) {
            this.removeBlocks(value);
        }
    },
    _showAllBrands: function(ev) {
        $('.selected').removeClass('selected');
        this.showAllBrands();
        var value = $('#search_box').val();
        this.removeBlocks(value);
    },
    _onKeyupInput: function(ev) {
        $('.selected').removeClass('selected');
        var value = $(ev.currentTarget).val();
        this.showAllBrands();
        this.enableBrandBox();
        if (value.length >= 1) {
            this.removeBlocks(value);
            this.disableBox(value);
        }
    },
    showAllBrands: function() {
        $('.brand-alpha-main').each(function(e) {
            $(this).find('.brand-item.d-none').each(function(e) {
                $(this).removeClass('d-none');
            });
            $(this).removeClass('d-none');
        });
    },
    removeBlocks: function(value) {
        $('.brand-alpha-main').each(function(i) {
            var flag = 0
            $(this).find('.brand-item').each(function(i) {
                var brand = $(this).find('.brand-name').text()
                if (brand.toLowerCase().indexOf(value.toLowerCase()) == -1) {
                    $(this).addClass('d-none');
                }
                if (!$(this).hasClass('d-none')) {
                    flag = 1;
                }
            });
            if (flag == 0) {
                $(this).addClass('d-none');
            }
        });
    },
    enableBrandBox: function() {
        $('.has-brands.active').each(function(i) {
            if ($(this).hasClass('disabled')) {
                $(this).removeClass('disabled');
            }
        });
    },
    disableBox: function(value) {
        var enabled_array = new Array();
        $('.brand-alpha-main').each(function(i) {
            var flag = 0;
            $(this).find('.brand-item').each(function(i) {
                if (flag == 0) {
                    var brand = $(this).find('.brand-name').text();
                    if (brand.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        enabled_array.push($(this).find('.brand-name').text().substring(0, 1).toLowerCase());
                        flag = 1;
                    }
                } else {
                    return false;
                }
            });
        });
        if (enabled_array.length == 0) {
            $('.has-brands.active').each(function(i) {
                $(this).addClass('disabled');
            });
        } else {
            enabled_array.forEach(function(item) {
                $('.has-brands.active').each(function(i) {
                    if ($.inArray($.trim($(this).children('.brand-alpha').text()), enabled_array) == -1) {
                        $(this).addClass('disabled');
                    }
                });
            });
        }
    }
});
registry.themeSearch = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    read_events: {
        'click .te_srch_icon': '_onSearchClickOpen',
        'keyup input[name="search"]': '_onSearchClickData',
        'click .te_srch_close': '_onSearchClickClose',
        'click .te_srch_close_ept': '_onSearchClickCloseEpt',
    },
    start: function() {
        var input_val = $('input[name="search"]').val();
        if (input_val) {
            $('.te_srch_close_ept').css("display", "block");
        }
    },
    _onSearchClickData: function(ev) {
        var self = ev.currentTarget;
        var input_val = $('input[name="search"]').val();
        if (input_val) {
            $('.te_srch_close_ept').css("display", "block");
        }
    },
    _onSearchClickCloseEpt:function(ev) {
        var params = new URLSearchParams(window.location.search);
        $('input[name="search"]').val('');
        const classExists = $('.te_searchform__body, .te_sub_search').length;
        if (classExists) {
            $('.te_srch_close_ept').css("display", "none");
        } else if (params.get('search')){
            $('button[type="submit"]').trigger('click');
        } else {
            $('.te_srch_close_ept').css("display", "none");
            $(".search_btn_close").trigger('click');
        }
    },
    _onSearchClickOpen: function(ev){
        var self = ev.currentTarget;
        setTimeout(function() { $('.o_searchbar_form input[name="search"]').focus(); }, 500);
        if ($('.te_header_style_right').length) {
            $(".te_search_popover").addClass("visible");
            $(self).hide()
            $(".te_srch_close").css('display', 'block');
        } else if ($(".te_searchform__popup").length) {
            $(".te_searchform__popup").addClass("open");
            $(".te_srch_close").show();
        }
    },
    _onSearchClickClose: function(ev){
        var self = ev.currentTarget;
        if ($('.te_header_style_right').length) {
            $(".te_search_popover").removeClass("visible");
            $(self).hide();
            $(".te_srch_icon").show();
        } else if ($(".te_searchform__popup").length) {
            $(".te_searchform__popup").removeClass("open");
            $(".te_srch_icon").show();
        }
    }
});
registry.responsiveMobileHeader = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    read_events: {
        'click .header_sidebar': '_headerSidebar',
        'click .close_top_menu': '_closeLeftHeader',
    },
    init: function() {
        this._super(...arguments);
        this.header_height = 0;
        if ($('.o_main_navbar').length) {
            this.header_height = $('.o_main_navbar').height();
        }
    },
    _headerSidebar: function() {
        $("#top_menu_collapse").addClass("header_menu_slide").css('top', this.header_height).show('slow');
        $("#top_menu_collapse").animate({
            width: '100%'
        });
        $("#wrapwrap").addClass("wrapwrap_trans_header");
        $(".te_mega_menu_ept a.dropdown-toggle.o_mega_menu_toggle").attr('href', '#');
        $(".parent-category .mobile_cate_child").attr('href', '#');
    },
    _closeLeftHeader: function() {
        $("#top_menu_collapse").animate({
            width: '0'
        });
        $("#wrapwrap").removeClass("wrapwrap_trans_header");
    }
});
 /* Attribute value tooltip */
$(function() {
    $('[data-bs-toggle="tooltip"]').tooltip({animation: true,delay: {show: 300,hide: 100} })
});
/*=== ScrollReview =====*/
registry.ScrollReview = publicWidget.Widget.extend(OwlMixin, {
    selector: '#wrapwrap',
    events: {
        'click .ept-total-review': 'scroll_review_tab',
    },
    scroll_review_tab: function() {
        if ($(window).width() >= 993) {
            if ($("#nav_tabs_link_ratings").length > 0) {
                var header_height = 10;
                if ($('header#top').length && !$('header').hasClass('o_header_sidebar')) {
                    if ($('header nav').hasClass('te_header_navbar')) {
                        this.header_height = $('header nav').height() + 30;
                    } else {
                        this.header_height = $('header').height() + 30;
                    }
                }
                var totalHeight = parseInt($("#nav-tab").offset().top) - parseInt(header_height) - parseInt($("#nav-tab").outerHeight());
                if ($(window).width() < 768)
                    totalHeight += 120;
                $([document.documentElement, document.body]).animate({
                    scrollTop: totalHeight
                }, 2000);
                $('#nav_tabs_link_ratings').trigger('click');
            }
        }
        if ($(window).width() <= 992) {
            if ($("#collapse_ratings").length > 0) {
                var header_height = 10;
                if ($('header#top').length && !$('header').hasClass('o_header_sidebar')) {
                    if ($('header nav').hasClass('te_header_navbar')) {
                        this.header_height = $('header nav').height() + 20;
                    } else {
                        this.header_height = $('header').height() + 20;
                    }
                }
                var totalHeight = parseInt($("#prd-tab-content").offset().top) - parseInt(header_height) - parseInt($("#prd-tab-content").outerHeight());
                if ($(window).width() < 768)
                    totalHeight += 120;
                $([document.documentElement, document.body]).animate({
                    scrollTop: totalHeight
                }, 2000);
                $('#collapse_ratings').trigger('click');
                $("#collapse_ratings").addClass("show");
            }
        }
    }
});
/*hotspot setting for display basic product card and advance product card*/
var timeout;
publicWidget.registry.displayHotspot = publicWidget.Widget.extend({
    selector: ".hotspot_element.display_card",
    events: {
        'mouseenter': '_onMouseEnter',
        'mouseleave': '_onMouseLeave',
    },

    start: function () {
        this.$el.popover({
            trigger: 'manual',
            animation: true,
            html: true,
            container: 'body',
            placement: 'auto',
            sanitize: false,
            template: '<div class="popover hotspot-popover" role="tooltip"><div class="tooltip-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
        });
        return this._super.apply(this, arguments);
    },

    _onMouseEnter: function (ev) {
        let self = this;
        self.hovered = true;
        clearTimeout(timeout);
        $(this.selector).not(ev.currentTarget).popover('hide');
        timeout = setTimeout(function () {
            /*Render the Hotspot Product detail popover template*/
            self._popoverRPC = $.get("/get-pop-up-product-details", {
                'product': parseInt($(ev.currentTarget).attr("data-product-template-ids")),
            }).then(function (data) {
                var WebsiteSale = new publicWidget.registry.WebsiteSale();
                const popover = Popover.getInstance(self.$el[0]);
                popover._config.content = data;
                popover.setContent(popover.getTipElement());
                self.$el.popover("show");
                $('.popover').on('mouseleave', function () {
                    self.$el.trigger('mouseleave');
                });
                $(".hotspot-popover .a-submit").off('click').on('click',function(ev) {
                    ev.preventDefault();
                    var $form = $(ev.currentTarget).closest('form')
                    WebsiteSale._handleAdd($form);
                });
            });
        }, 300);
    },

    _onMouseLeave: function (ev) {
        let self = this;
        self.hovered = false;
        setTimeout(function () {
            if ($('.popover:hover').length) {
                return;
            }
            if (!self.$el.is(':hover')) {
               self.$el.popover('hide');
            }
        }, 1000);
    },
});
publicWidget.registry.ProductWishlist.include({
    'selector': '#wrapwrap',
});
publicWidget.registry.ProductComparison.include({
    'selector': '#wrapwrap',
});
