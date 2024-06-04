/** @odoo-module **/
import { Wysiwyg } from '@web_editor/js/wysiwyg/wysiwyg';
import { patch } from "@web/core/utils/patch";

patch(Wysiwyg.prototype, {
    async start() {
        if($('#id_lazyload').length) {
            $('img.lazyload').each(function(){
                var getDataSrcVal = $(this).attr('data-src');
                if(getDataSrcVal == undefined || getDataSrcVal != ''){
                    $(this).attr('src', getDataSrcVal);
                    $(this).attr('data-src', '');
                }
            });
        }
        await super.start();
    },
    async _saveElement($el, context) {
        var oldHtml = $el;
        /* Apply Lazyload for all snippet images*/
        if($el.parents().find("#id_lazyload").length) {
            if(oldHtml){
                $.each(oldHtml.find('img.lazyload'), function(index, value){
                    var getDataSrcVal = $(value).attr('data-src');
                    var getSrcVal = $(value).attr('src');
                    var getWeb = $($el.parents().find(".current_website_id")).val();
                    if(getDataSrcVal == undefined || getDataSrcVal != ''){
                        $(value).attr('src', '/web/image/website/'+ getWeb +'/lazy_load_image');
                        $(value).attr('data-src', getSrcVal);
                    }
                });
            }
        }
        var updateHtml = oldHtml[0].outerHTML;
        // Saving a view content
        await super._saveElement(...arguments);
    },
});