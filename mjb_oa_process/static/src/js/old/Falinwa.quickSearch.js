class Falinwa_quickSearch {
    constructor(container) {
        const s = this;
        s._ = container;
        s._debug = s._._debug
        s._parentPrefix = s._._uiPrefix;
        s._jQuery = s._._opts.jQuery;
        s._name = 'SRH';
        s._logger = new(s._._classes[`logger`])(s);
        s._prefix = 'quickSearch';
        s._searchId = 0;
        s._searchDelayTimer = 500;
    }

    start() {
        const s = this;
        s.logf(`start`);
        s.setUI();
        s.setKeyListener();
        s._.addToMenu(`${s._prefix}SmartMenuEntry`, `QuickSearch`, `lens`);
    }

    gUI(name) {
        const s = this;
        return s._._ui[`${s._prefix}${name}`];
    }

    sUI(name, el) {
        const s = this;
        s._._ui[`${s._prefix}${name}`] = el;
        return true;
    }

    setUI() {
        const s = this;
        s.logf(`setUI`);

        s.sUI('Container', s._jQuery(`<div id="${s._parentPrefix}-${s._prefix}-container"></div>`));
        s.gUI('Container').appendTo(s._._ui.overlay);

        s.sUI('Nav', s._jQuery(`<div id="${s._parentPrefix}-${s._prefix}-navbar" class="navbar fal-gradient fal-text-white"><i class="fa fa-lg fa-chevron-left" aria-hidden="true"></i><span class="fal-text-large fal-text-bold">Quick Search <small>(ESC to exit)</small></span></div>`));
        s.gUI('Nav').appendTo(s.gUI('Container'));

        s.gUI('Nav').find('i').click(function () {
            s.cleanQuickSearchInput();
        })

        s.sUI('RowContainer', s._jQuery(`<div class="container"  style="padding-top: 30px;width:100%;"></div>`))
        s.gUI('RowContainer').appendTo(s.gUI('Container'));

        s.sUI('Row', s._jQuery(`<div class="row"></div>`));
        s.sUI('Left', s._jQuery(`<div class="col-sm-4"></div>`));
        s.sUI('Right', s._jQuery(`<div class="col-sm-8"></div>`));

        s.gUI('Left').appendTo(s.gUI('Row'));
        s.gUI('Right').appendTo(s.gUI('Row'));
        s.gUI('Row').appendTo(s.gUI('RowContainer'));

        //set overlay search bar
        s.sUI('Input', s._jQuery(`<input type="text" id="${s._parentPrefix}-${s._prefix}-input" placeholder="Search here" />`));
        s.sUI('Loader', s._jQuery(`<div id="${s._parentPrefix}-${s._prefix}-loader" class="load1"><div class="fal-loader">Loading...</div></div>`));

        s.gUI('Input').appendTo(s.gUI('Left'));
        s.gUI('Loader').appendTo(s.gUI('Left'));

        s.sUI('Help', s._jQuery(`<div id="${s._parentPrefix}-${s._prefix}-help"></div>`));
        s.gUI('Help').appendTo(s.gUI('Left'));
        s._jQuery(`<br />`).appendTo(s.gUI('Help'));
        s._jQuery(`<hr /><h4>Quick search filters</h4>`).appendTo(s.gUI('Help'));
        //s._jQuery(`<pre><a class="fal_quicksearch_helper_link" href="#product.template">product.template: </a> Search product templates only</pre>`).appendTo(s._ui['help']);
        //s._jQuery(`<pre><a class="fal_quicksearch_helper_link" href="#product.template">product.product: </a> Search product variants only</pre>`).appendTo(s._ui['help']);
        //s._jQuery(`<pre><a class="fal_quicksearch_helper_link" href="#product.template">model: </a> Search any odoo model in general only</pre>`).appendTo(s._ui['help']);


        //set overlay search results
        s.sUI('Results', s._jQuery(`<ul id="${s._parentPrefix}-${s._prefix}-results"></ul>`));
        s.gUI('Results').appendTo(s.gUI('Right'));
        s.hideLoader();
    }

    setKeyListener() {
        const s = this;
        s.logf(`setKeyListener`);

        var DELETE_KEY = 8;
        var ENTER_KEY = 13;
        var ESCAPE_KEY = 27;

        s._jQuery(window).keydown(e => {
            if (!s.checkIsFocusedOnInput()) {
                if (e.which === DELETE_KEY) {
                    s.removeLastCharInput();
                    s.confirmQuickSearchInput();
                }

                if (e.which === ESCAPE_KEY)
                    s.cleanQuickSearchInput();

                if (e.which === ENTER_KEY)
                    s.confirmQuickSearchInput();
            }
        })

        s._jQuery(window).keypress(e => {
            if (!s.checkIsFocusedOnInput()) {
                var keyChar = String.fromCharCode(e.which);
                if (/[a-zA-Z0-9-_ ]/.test(keyChar)) {
                    s.addCharToInput(keyChar);
                    s.confirmQuickSearchInput();
                }
            }
        })
    }

    getInput() {
        const s = this;
        s.logf(`getInput`);
        var input = (s.gUI('Input').val() === 'undefined') ? false : s.gUI('Input').val();
        return input;
    }

    checkIsFocusedOnInput() {
        const s = this;
        //s.logf(`checkIsFocusedOnInput`);

        var activeElement = document.activeElement;
        if (s.inputIsInFocus()) {
            return false;
        }
        var inputs = ['input', 'select', 'button', 'textarea'];

        if (
            activeElement &&
            inputs.indexOf(activeElement.tagName.toLowerCase()) !== -1) {
            return true;
        }

        return false;
    }


    cleanQuickSearchInput() {
        const s = this;
        s.logf(`cleanQuickSearchInput`);
        s.gUI('Input').val("");
        s.hide();
    }

    hide() {
        const s = this;
        s.logf(`hide`);
        s._.toggleUI(`${s._prefix}Container`, 'hide');
        s.hideLoader();
    }

    show() {
        const s = this;
        s.logf(`show`);
        s._.toggleUI(`${s._prefix}Container`, 'show');
    }

    removeLastCharInput() {
        const s = this;
        s.logf(`removeLastCharInput`);

        if (!s.inputIsInFocus()) {
            var input = s.getInput();
            if (input)
                s.gUI('Input').val(input.slice(0, -1));

            s.gUI('Input').focus();
        }
    }

    inputIsInFocus() {
        const s = this;
        return s.gUI('Input').is(':focus');
    }

    addCharToInput(keyChar) {
        const s = this;
        s.logf(`addCharToInput: ${keyChar}`);

        if (!s.inputIsInFocus()) {
            var input = s.getInput();
            s.log(`initial input: ${s.getInput()}`)
            if (input) {
                s.gUI('Input').val(input + keyChar);
            } else {
                s.gUI('Input').val(keyChar);
            }
            s.log(`after input: ${s.getInput()}`)

            s.gUI('Input').focus();
        }
    }

    showLoader() {
        const s = this;
        s.logf(`showLoader`);
        s.gUI('Loader').show();
    }

    hideLoader() {
        const s = this;
        s.logf(`hideLoader`);
        s.gUI('Loader').hide();
    }

    confirmQuickSearchInput() {
        const s = this;
        s.logf(`confirmQuickSearchInput`);
        s.show();
        s._searchId++;
        var searchId = JSON.parse(JSON.stringify(s._searchId)); //deep copy
        s.showLoader();

        setTimeout(function () {
            if (searchId === s._searchId) {
                var input = s.getInput();
                if (input) {
                    try {
                        s.search(input);
                    } catch (err) {
                        s.log(err)
                        s.hideLoader();
                    }
                } else {
                    s.hideLoader();
                }
            }
        }, s._searchDelayTimer)
    }





    getModelDomain(input, model) {
        const s = this;
        s.logf(`getModelDomain: ${input} / model: ${model}`);

        return [
            ['name', 'like', input]
        ];
    }

    getModelFields(input, model) {
        const s = this;
        s.logf(`getModelFields: ${input} / model: ${model}`);

        return ['id', 'display_name'];
    }

    getSearchableModels(input) {
        return ['ir.ui.menu', 'sale.order', 'purchase.order', 'ir.model', 'ir.model.fields', 'product.template', 'res.partner', 'account.invoice']; //,,'product.product'//'product.template', 'account.move.line', 'account.move', 'res.partner', 'sale.order', 'purchase.order', 'account.invoice', 
    }

    cache(input, results) {
        const s = this;
        s.logf(`cache`);
        return s._._queryEngine.cache(input, results)
    }

    getCache(input) {
        const s = this;
        s.logf(`getCache`);
        return s._._queryEngine.getCache(input)
    }

    async getModel(model, fields, domain) {
        const s = this;
        s.logf(`getModel`);
        return s._._queryEngine.getModel(model, fields, domain)
    }

    async search(input) {
        const s = this;
        s.logf(`search: ${input}`);

        var results = s.getCache(input);

        if (input.length === 0) {
            results = [];
        } else {
            if (!results) {
                try {
                    var searchableModels = s.getSearchableModels(input);

                    results = await Promise.all(searchableModels.map(model => {

                        var fields = s.getModelFields(input, model);
                        var domain = s.getModelDomain(input, model);
                        return s.getModel(model, fields, domain)
                    }));

                    s.cache(input, results);
                } catch (err) {
                    results = [];
                    s.log(err)
                }
            }
        }

        s.cleanResults();

        var hasResults = false;
        if (results.length > 0) {
            results.map(v => {
                if (v.rows.length > 0) {
                    v.rows.map(r => {
                        r['url'] = s.getUrlFromRow(r, v.model);
                        s.addResult(r, v.model);
                        hasResults = true;
                    })
                }
                return true;
            });
        }
        if (!hasResults) {
            s.addResult({
                id: '#',
                display_name: 'No results',
                url: '#'
            }, 'Error')
        }


        s.hideLoader();
        return true;
    }

    getUrlFromRow(r, m) {
        const s = this;
        s.logf(`getUrlFromRow: ${m}`);

        switch (m) {
            case 'ir.ui.menu':
                return `${s._._serverURL}/web?debug#menu_id=${r.id}`;
                break;

            case 'ir.model':
                return `${s._._serverURL}/web?debug#id=${r.id}&view_type=form&model=ir.model&menu_id=29&action=14`;
                break;

            case 'ir.model.fields':
                return `${s._._serverURL}/web?debug#id=${r.id}&view_type=form&model=ir.model.fields&menu_id=30&action=15`;
                break;

            case 'sale.order':
                return `${s._._serverURL}/web#id=${r.id}&view_type=form&model=sale.order&menu_id=232&action=333`;
                break;

            case 'purchase.order':
                return `${s._._serverURL}/web#id=${r.id}&view_type=form&model=purchase.order&menu_id=251&action=355`;
                break;

            case 'account.invoice':
                return `${s._._serverURL}/web#id=${r.id}&view_type=form&model=account.invoice&menu_id=123&action=199`;
                break;

            case 'res.partner':
                return `${s._._serverURL}/web#id=${r.id}&view_type=form&model=res.partner&menu_id=209&action=48`;
                break;

            case 'product.template':
                return `${s._._serverURL}/web#id=${r.id}&view_type=form&model=product.template&menu_id=219&action=119`;
                break;


            default:
                return '#';
                break;
        }
    }

    addResult(row, model) {
        const s = this;
        s.logf(`addResult: ${model}`);
        s._jQuery(`<li><span data-color="0" data-id="1" data-index="0" class="badge o_tag_color_0"><span class="o_badge_text">${model}</span></span><a class="fal-quickSearch-results-links" notarget="_blank" href="${row.url}">${row.display_name}</a></li>`).appendTo(s.gUI('Results'));
        s.gUI('Results').find('.fal-quickSearch-results-links').click(function (e) {
            s.hide();
        });
        s.log(row);
    }

    cleanResults() {
        const s = this;
        s.logf(`cleanResults`);
        s.gUI('Results').find('li').remove();
    }
}

odoo.define('Falinwa.quickSearch', function (require) {
    "use strict";
    return Falinwa_quickSearch;
});