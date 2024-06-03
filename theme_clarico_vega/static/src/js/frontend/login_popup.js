/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
var registry = publicWidget.registry;

import animations from "@website/js/content/snippets.animation";

registry.LoginSigninPopup = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click .te_signin': '_te_signin',
        'click #loginRegisterPopup .open_reset_password':'_open_reset_password',
        'click #loginRegisterPopup .back_login': '_back_login',
        'click #loginRegisterPopup .close':'_close',
        'click .validate-sign-in':'_validateSignin',
    },
    _te_signin: function(){
        $("#loginRegisterPopup").modal();
        $("#loginRegisterPopup, .modal-body").show();
        $("#loginRegisterPopup").addClass("show modal_shown");
        $("#loginRegisterPopup .oe_reset_password_form").hide();

        $("#loginRegisterPopup .oe_login_form").show();
        $(document).mouseup(function (e) {
            if ($(e.target).closest(".modal-body").length === 0) {
                $("#loginRegisterPopup").removeClass("show modal_shown").hide();
            }
        });
    },
    _open_reset_password:function(){
        $("#loginRegisterPopup .oe_login_form").hide();
        $("#loginRegisterPopup .oe_reset_password_form").show();
    },
    _back_login: function(){
        $("#loginRegisterPopup .oe_reset_password_form").hide();
        $("#loginRegisterPopup .oe_login_form").show();
    },
    _close: function(){
        $("#loginRegisterPopup").hide();
    },
    _validateSignin: function(e){
        $("#loginRegisterPopup").modal();
        $("#loginRegisterPopup, .modal-body").show();
        $("#loginRegisterPopup").addClass("show modal_shown");
        $("#loginRegisterPopup .oe_reset_password_form").hide();

        var tab = e && $(e.currentTarget).attr('href');
        $('.nav-tabs a[href="' + tab + '"]').tab('show')
        $(document).mouseup(function (e) {
            if ($(e.target).closest(".modal-body").length === 0) {
                $("#loginRegisterPopup").removeClass("show modal_shown").hide();
            }
        });
    },
});

animations.registry.LoginPopup = animations.Animation.extend({
    selector: "#wrapwrap",
    events: {
        'click .o_action': '_onClickAction',
        'submit #loginRegisterPopup .oe_login_form': '_customerLogin', // on submit of login form from popup
        'submit #loginRegisterPopup .oe_signup_form': '_customerRegistration', // on submit of signup form from popup
        'submit #loginRegisterPopup .oe_reset_password_form': '_resetPassword' // on submit of reset password form from popup
    },
    start: function() {
        var self = this;
    },
    _customerLogin: function(e) {
            e.preventDefault()
            var $form = $(e.currentTarget)
            $.ajax({
                url: '/web/login',
                type: 'POST',
                data: $($form).serialize(),
                async: false,
                success: function(data) {
                    var doc = new DOMParser().parseFromString(data, "text/html");
                    var links = doc.querySelectorAll("a");
                    var data_main = JSON.parse(data);
                    var submit_btn = $("#loginRegisterPopup .oe_login_form .te_login_button");
                    if (data_main.login_success && data_main.redirect) {
                        if (data_main.redirect != '1') {
                            $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-danger").removeClass('d-none').addClass('d-none');
                            if (typeof data_main.hide_msg != 'undefined' && !data_main.hide_msg) {
                                $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-success").removeClass('d-none');
                            }
                            window.location.replace(data_main.redirect)
                        } else {
                            $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-danger").removeClass('d-none').addClass('d-none');
                            $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-success").removeClass('d-none');
                            window.location.reload()
                        }
                    } else if (!data_main.login_success && data_main.error) {
                        $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-success").removeClass('d-none').addClass('d-none');
                        $("#loginRegisterPopup .oe_login_form .alert-success-error .alert-danger").html(data_main.error).removeClass('d-none');
                        $(submit_btn).removeClass('o_website_btn_loading disabled');
                        $(submit_btn).removeAttr('disabled');
                        $("#loginRegisterPopup .oe_login_form .oe_login_buttons .te_login_button .fa-spin").removeClass('fa-refresh fa-spin me-2');
                   }
                },
                error: function(data) {
                    console.log('An error occurred.')
                },
            });
        },

    _customerRegistration: function(e) {
        e.preventDefault()
        var $form = $(e.currentTarget)
        $.ajax({
            url: '/web/signup',
            type: 'POST',
            data: $($form).serialize(),
            async: false,
            success: function(data) {
                var data_main = JSON.parse(data);
                if (data_main.login_success && data_main.redirect) {
                    $("#loginRegisterPopup .oe_signup_form .alert-success-error .alert-danger").removeClass('d-none').addClass('d-none');
                    $("#loginRegisterPopup .oe_signup_form .alert-success-error .alert-success").removeClass('d-none');
                    window.location.reload()
                } else if (!data_main.login_success && data_main.error) {
                    $("#loginRegisterPopup .oe_signup_form .alert-success-error .alert-success").removeClass('d-none').addClass('d-none');
                    $("#loginRegisterPopup .oe_signup_form .alert-success-error .alert-danger").html(data_main.error).removeClass('d-none');
                    $("#loginRegisterPopup .oe_signup_form .oe_login_buttons .te_signup_button").removeAttr('disabled');
                    $("#loginRegisterPopup .oe_signup_form .oe_login_buttons .te_signup_button .fa-spin").removeClass('fa-refresh fa-spin');
                }
            },
            error: function(data) {
                console.log('An error occurred.')
            },
        });
    },

    _resetPassword: function(e) {
            e.preventDefault()
            var $form = $(e.currentTarget)
            $.ajax({
                url: '/web/reset_password',
                type: 'POST',
                data: $($form).serialize(),
                async: false,
                success: function(data) {
                    var data_main = JSON.parse(data);
                    if (data_main.error) {
                        $("#loginRegisterPopup .oe_reset_password_form .alert-success-error").html('<p class="alert alert-danger">' + data_main.error + '</p>')
                    } else if (data_main.message) {
                        $("#loginRegisterPopup .oe_reset_password_form .alert-success-error").html('<p class="alert alert-success">' + data_main.message + '</p>')
                    }
                    setTimeout(function () {
                        $("#loginRegisterPopup").hide();
                    }, 1000);
                },
                error: function(data) {
                    console.log('An error occurred.')
                },
            });
        },
});