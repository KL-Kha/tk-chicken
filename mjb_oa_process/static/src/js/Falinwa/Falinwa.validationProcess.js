/** @odoo-module */
import { ormService } from "@web/core/orm_service";
import { registry } from "@web/core/registry";
import { renderToString , renderToElement} from "@web/core/utils/render";
import { Component, xml, onWillStart, App } from "@odoo/owl";
import { session } from '@web/session';
import { append, createElement, parseXML } from "@web/core/utils/xml";

export class ValidationProcess {
    constructor(opt) {
        const self = this
        self._opt = opt
        self._name = self.constructor.name
        self._functionPrefix = "[F] "
        self._indentChar = " "
        self._logIndentLevel = 0
        self._timerLoop = 1000 * 2
        self._debug = true
        self._cache = {}
//        self._session = self._opt.lib.session;
//        self.ORM = new self._opt.lib.orm.ORM()
        self._session = self._opt.session || false;
        self.ORM = self._opt.services.orm
        self._config = {
            processModel: 'fal.vprocess',
            processFields: {
                name: 'name',
                active: 'active',
                disableEdit: 'disable_edit',
                model: 'model_id',
                modelName: 'model_name',
                startCondition: 'trigger_id',
                startConditionDomain: 'trigger_domain',
                filter: 'filter_id',
                filterDomain: 'filter_domain'
            },
            stepModel: 'fal.vprocess.step',
            stepFields: {
                name: 'name',
                active: 'active',
                disableEdit: 'disable_edit',
                process: 'process_id',
                sequence: 'sequence'
            },
            ruleModel: 'fal.vprocess.rule',
            ruleFields: {
                name: 'name',
                active: 'active',
                step: 'step_id',
                authorizedUsers: 'user_ids',
                applyOn: 'filter_id',
                applyOnDomain: 'domain',
                sequence: 'sequence',
            },
            executionModel: 'fal.vprocess.execution',
            executionFields: {
                name: 'name',
                active: 'active',
                targetId: 'target',
                process: 'process_id',
                process_model: 'process_model',
                step: 'step_id',
                previousStep: 'previous_step_id',
                lastAction: 'last_action',
                stepSequence: 'step_sequence',
                isFinal: 'finished',
                isCancelled: 'cancelled'
            },
            ui: {
                prefix: 'validationProcess_',
                tags: {
                    formEditBtn: '.o_form_button_edit',
                    formSaveBtn: '.o_form_button_save',
                    statusBar: '.o_form_statusbar',
                    statusBarButtons: '.o_statusbar_buttons',
                    editionButtons: '.o_form_button_edit', //'.o_cp_buttons',
                    btnBox: '.oe_button_box',
                    formTitle: '.oe_title'
                },
                classes: {
                    controlEnabled: 'enabled',
                    controlDisabled: 'disabled',
                    processActionBar: 'actionBar',
                    processActionBtn: 'actionBtn',
                    processHistoryBar: 'historyBar',
                    processActionBarLoaded: 'processActionBarLoaded',
                    noAccessRights: 'noAccessRights',
                    noNextStep: 'noNextStep',
                    noPrevStep: 'noPrevStep',
                    haveAccessRights: 'haveAccessRights',
                    isFinal: 'isFinal'
                    // hasActiveRule: 'hasActiveRule'
                }
            },
            checkTimer: 250,
            cacheTimer: 10000
        }

        self.register()
    }

    // HELPERS
    now() {
        const self = this
        return new Date();
    }

    now_toLocaleTimeString() {
        const self = this
        return self.now().toLocaleTimeString();
    }
    now_toLocaleString() {
        const self = this
        return self.now().toLocaleString();
    }

    log(msg, type = 'log', indent = false) {
        const self = this
        indent = indent ? self._indentChar.repeat(self._logIndentLevel) : self._indentChar;

        if (self._debug)
            console[type](self.now_toLocaleTimeString() + " | " + `${self._name} | ` + indent + `${msg.toString()}`);
    }

    logf(msg, end = false) {
        const self = this
        if (!end) {
            self._logIndentLevel++;
        }
        else {
            self._logIndentLevel--;
        }
        self.log(self._functionPrefix + `${msg.toString()}`);
    }

    getUrl() {
        const self = this
        var protocol = 'http://';
        if (window.location.href.indexOf("https") > -1) {
            protocol = 'https://';
        }


        var domainRoot = document.domain;
        var domainParts = document.domain.split('.');
        if (domainPartself.length >= 2) {
            domainRoot = domainParts[domainPartself.length - 2] + '.' + domainParts[domainPartself.length - 1];
        }

        return {
            url: `${protocol}${document.domain}`,
            domain: document.domain,
            domainRoot: domainRoot,
            protocol: protocol
        }
    }


    getUrlParam(p) {
        const self = this
        var params = self.getAllUrlParam();
        // console.log(params)
        return paramself.hasOwnProperty(p) ? params[p] : null;
    }

    getAllUrlParam(url = window.location.href) {
        const self = this
        if (url.includes('?')) {
            url = url.split('?')[1];
        }

        if (url.includes('#')) {
            url = url.split('#')[1];
        }

        return url.split('&').reduce((p, v) => {
            if (v.includes('#'))
                v = v.split('#')[1];
            v = v.split('=');
            if (v.length === 2)
                p[v[0]] = v[1];
            return p;
        }, {});
    }

    setCache(key, value) {
        const self = this
        //s.logf(`setCache`);
        self._cache[key] = value;
    }

    getCache(key) {
        const self = this
        //s.logf(`getCache`);
        if (self._cache.hasOwnProperty(key))
            return self._cache[key];
        return null;
    }

    cleanCache() {
        const self = this
        //s.logf(`cleanCache`);
        self._cache = {};
    }

    async createUpdate(model, item) {
        const self = this
        // s.logf(`createUpdate: ${model}`);

        var method = 'create';
        var args = [
            item
        ];

        if (item.hasOwnProperty('id')) {
            method = 'write';
            args = [
                item.id,
                item
            ];
        }

        var output = false;
//        fixme
        try {
            output = await self.ORM.call(
                model = model,
                method = method,
                args = args,
            )
        }
        catch (err) {
            self.log(err)
        }

        // s.setCache(cacheKey, output);
        return output;
    }


    async sleep(timer) {
        const self = this
        self.logf(`sleep: ${timer}`);
        return new Promise(res => {
            setTimeout(function () {
                res(true);
            }, timer)
        })
    }

    async getScript(url) {
        const self = this
        return new Promise(res => {
            $.getScript(url, function (jd) {
                res(true)
            });
        })
    }


    async searchOne(q) {
        var self = this;
        self.log("searchOne")
        q['limit'] = 1
        q['offset'] = 0
        let res = await self.search(q)
        if (reself.length > 0)
            return res[0]
        return null
    }

    ;

    async searchLegacy(model, fields = ["id"], domain = [], offset = 0, limit = 10, order = "id asc") {
        const self = this;
        // self.log(`searchLegacy`);
        return self.searchRead({
            model: model,
            domain: domain,
            fields: fields,
            limit: limit,
            offset: offset,
            order: order
        })
    }

    async searchRead({
        model = 'ir.ui.menu',
        domain = [],
        fields = ['id', 'name'],
        limit = 10,
        offset = 0,
        order = 'name asc'
    }) {
        const self = this;
        self.log(`searchRead`);

        var query = {
            model: model,
            method: 'search_read',
            args: [
                domain,
                fields,
                offset,
                limit,
                order
            ]
        };

        var results = [];
        try {
            results = await self.ORM.call(query['model'], query['method'], query['args']);
        } catch (e) {
            self.log(`[ERROR] Cannot retrieve results`);
            console.error(e);
        }
        return results;
    }

    register() {
        var self = this;
        self.log("register")
        if (!odoo['_mb']) {
            odoo['_mb'] = {}
        }
        odoo['_mb'][self._name] = self
    }

    // BUSINESS
    execLoop() {
        var self = this;
        // self.log("execLoop")
    }

    initLoop() {
        var self = this;
        self.log("initLoop")

        self._loop = setInterval(function () {
            self.execLoop()
        }, self._timerLoop)
        self.execLoop()
    }

    start() {
        var self = this;
        self.log("start")
        self.initLoop()
        self.asyncStart().then(r => console.log(r))
        // .catch(err => console.error(err))
    }

    // VALIDATION PROCESS
    // asynchronous start function
    // We use async here and there as we rely on multiple rpc calls
    async asyncStart() {
        const s = this;
        s.logf(`asyncStart`);

        // Build the validation_process UI template on first load
        // This template is built only once, then later copied by jQuery
        // This is to avoid building it only when required, copy is faster than rebuild
        // @TODO would be great to have this as a Odoo XML view instead of building it on JS
        s.buildTemplate();

        // Build cache for all relevant data
        // This is to speed up execution after first load
        await s.setAllCache();

        // @TODO: Change this. It should not be a loop to check for view change
        // Instead it should be hooked on Odoo UI native events
        s.watchUI();
        return true;
    }

    buildTemplate() {
        const s = this;
        s.logf(`buildTemplate`);
        if ($(`#${s.genId('template')}`).length > 0) {
            return false;
        }

        $(`<div id="${s.genId('template')}"></div>`).insertAfter($('body'));
        s.template = $(`#${s.genId('template')}`);

        // add all the related process controls in one div inside
        // the a holder in the form
        s.template
            .prepend(
                `<div 
                    id="${s.genId('processActionBar')}"
                    class="${s.genClass('processActionBar')}">
                </div>`);

        var processActionBar = s.template.find('#' + s.genId('processActionBar'));

        processActionBar.append(s.btnGen({
            title: 'Loading',
            subtitle: 'process',
            name: 'loading',
            color: 'grey_dark',
            icon: 'spinner fa-spin',
            styleBtn: '',
        }));

        // buttons to add
        var buttons = [{
            title: 'Error',
            subtitle: 'contact admin',
            name: 'error',
            color: 'red',
            icon: 'times-circle',
            styleBtn: '',
        }, {
            title: 'Pending',
            subtitle: 'approval',
            name: 'pending',
            color: 'orange',
            icon: 'warning',
            styleBtn: '',
        },
        {
            title: 'Approve',
            subtitle: 'confirm',
            name: 'confirm',
            color: 'green',
            icon: 'check',
            styleBtn: '',
        }, {
            title: 'Back',
            subtitle: "prev. step",
            name: 'back',
            color: 'black',
            icon: 'backward',
            styleBtn: '',
        }, {
            title: 'Restart',
            subtitle: "",
            name: 'restart',
            color: 'black',
            icon: 'refresh',
            styleBtn: '',
        },
        {
            title: 'Cancel',
            subtitle: '',
            name: 'cancel',
            color: 'red',
            icon: 'times',
            styleBtn: '',
        }, {
            title: 'Approved',
            subtitle: 'finished',
            name: 'approved',
            color: 'green',
            icon: 'check-circle',
            styleBtn: ''
        }, {
            title: 'Cancelled',
            subtitle: 'finished',
            name: 'cancelled',
            color: 'red',
            icon: 'times',
            styleBtn: ''
        }, {
            title: 'Info',
            subtitle: 'steps',
            name: 'info',
            color: 'blue',
            icon: 'info',
            styleBtn: ''
        }, {
            title: 'History',
            subtitle: 'process',
            name: 'history',
            color: 'blue',
            icon: 'history',
            styleBtn: ''
        },
        ];

        buttons.map(btn => {
            processActionBar.append(s.btnGen(btn));
        });

        processActionBar
            .find(`.${s.genClass('processActionBtn')}`)
            .click((e) => {
                s.handleClick($(e.currentTarget).attr('name'), $(e.currentTarget))
                    .then(d => { })
                    .catch(e => { s.handleError('CLICK_FAIL', e) });
            });

        //processActionBar.addClass(s.genClass('processActionBarLoaded'));
        return true;
    }

    genId(name) {
        const s = this;
        return s._config.ui.prefix + name;
    }

    async setAllCache() {
        const s = this;
        s.logf(`setAllCache`);
        // self._session = odoo.session
        await s.setProcessCache();
        await s.setStepCache();
        await s.setRuleCache();
        await s.setUserCache();
        s.user = s.getUserData(s._session.uid);
        return s._cache;
    }

    async setProcessCache() {
        const s = this;
        s.logf(`setProcessCache`);
        s._cache['processes'] = await s.searchLegacy("fal.vprocess", [], [
            ["active", '=', true],
        ], 0, false);
        return s._cache['processes'];
    }

    async setStepCache() {
        const s = this;
        s.logf(`setStepCache`);
        s._cache['steps'] = await s.searchLegacy(
            "fal.vprocess.step", [], [
            ["active", '=', true],
        ], 0, false, "sequence asc");

        s._cache.steps.sort(function (a, b) {
            var keyA = a["sequence"],
                keyB = b["sequence"];
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        return s._cache['steps'];
    }

    async setRuleCache() {
        const s = this;
        s.logf(`setRuleCache`);
        s._cache['rules'] = await s.searchLegacy(
            'fal.vprocess.rule', [
            'id', 'name', 'domain', 'active', 'custom_user_domain', 'user_ids', 'sequence', 'step_id', 'filter_id'
        ], [
            ['active', '=', true],
        ],
            0,
            false, "sequence asc");

        s._cache.rules.sort(function (a, b) {
            var keyA = a["sequence"],
                keyB = b["sequence"];
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        return s._cache['rules'];
    }

    async setUserCache() {
        const s = this;
        s.logf(`setUserCache`);
        // get all related users at once, avoid too many requests
        s._cache['users'] = await s.searchLegacy(
            'res.users', ['id', 'name', 'partner_id'], [
            ['active', '=', true],
        ], 0, false);

        return s._cache['users'];
    }

    getUserData(userId) {
        const s = this;
        s.logf(`getUserData: ${userId}`);

        if (s._cache.users) {
            var userFound = s._cache.users.filter(u => u.id === userId);
            if (userFound.length > 0)
                return userFound[0];
        }
        return false;
    }

    watchUI() {
        const s = this;
        s.logf(`watchUI`);

        s.loop = null;
        s.isChecking = false;

        s.prevState = {
            id: false,
            model: false,
            view_type: false,
            form_sheet_class: false,
            hasEditButton: false,
            hasSaveButton: false
        };

        s.loop = setInterval(
            () => {
                // only performs checks if the module is not disabled
                // module is disabled when an error occurred
                if (s.isDisabled) {
                    //s.destroy('IS_DISABLED');
                    return false;
                }

                // use a flag to avoid piling up multiple checks
                if (s.isChecking)
                    return false;
                s.isChecking = true;

                // @TODO this should also leverage Odoo native controller possibilities
                // As URL params is not optimal
                // check if url contains all the required parameters 
                var urlParams = s.getAllUrlParam();

                //we check if the view has changed by checking if any of the following changed
                // - the current object id + model
                // - the view type
                // - the class of the form sheet => it may have been reloaded by a button

                var currentState = {
                    id: urlParams['id'] || (urlParams.hasOwnProperty('id') ? -1 : false),
                    model: urlParams['model'] || false,
                    view_type: urlParams['view_type'] || false,
                    form_sheet_class: $('.o_form_view').length > 0 ? ($('.o_form_view').className ? $('.o_form_view').className : false) : false,
                    hasEditButton: ($(".o_form_button_edit").length > 0) && $(".o_form_button_edit").is(':visible'),
                    hasSaveButton: ($(".o_form_button_save").length > 0) && $(".o_form_button_save").is(':visible')
                };

                // console.log(urlParams)
                // console.log(currentState)
                // return true

                // If we had a change, refreh UI
                var hasChanged = (JSON.stringify(s.prevState) !== JSON.stringify(currentState));

                s.prevState = currentState;

                if ((currentState.hasSaveButton || currentState.hasEditButton) && hasChanged) {
                    s.log(`State changed`);

                    $('.o_statusbar_buttons').find('button').each(function () {

                        if (!$(this).hasClass('validationProcess_alreadyBinded')) {
                            $(this).addClass('validationProcess_alreadyBinded');
                            s.log('validationProcess_alreadyBinded !');

                            $(this).click(function () {
                                s.log('click');
                                setTimeout(function () {

                                    s.onDocumentChanged(currentState.id, currentState.model, currentState.view_type).catch(err => {
                                        return s.handleError('ON_DOCUMENT_CHANGED_FAILED', err);
                                    }).finally(data => {
                                        s.isRefreshing = false;
                                    });
                                }, 500);
                            })
                        }
                    });

                    s.onDocumentChanged(currentState.id, currentState.model, currentState.view_type).catch(err => {
                        return s.handleError('ON_DOCUMENT_CHANGED_FAILED', err);
                    }).finally(data => {
                        s.isRefreshing = false;
                    });
                }

                s.isChecking = false;
            },
            s._config.checkTimer);
    }

    destroy(reason = '') {
        const s = this;
        s.logf(`destroy: ${reason}`);

        // reset parameters
        s.id = false;
        s.model = false;
        s.view_type = false;

        s.process = false;
        s.execution = false;

        s.ui = false;
        s.isRefreshing = false;
        $(s._config.ui.tags.btnBox).addClass("no_process");

        //handle code
        switch (reason) {

            case 'NO_NEED':
                s.unlockUI();
                break;

            case 'NO_PROCESS':
                s.unlockUI();
                break;

            case 'NO_STEP':
                s.unlockUI();
                break;

            case 'PROCESS_NOT_STARTED':
                s.unlockUI();
                break;

            default:
                s.unlockUI();
                //s.removeControls();
                //console.warn(`The module validation process stopped, reason: ${reason}.`)
                // s.isDisabled = true;
                break;
        }
        return true;
    }

    toggleStatus(activated = true, status, prefixIs = 'is', prefixNot = 'isNot') {
        const s = this;
        var addedStatus = activated ? prefixIs + status : prefixNot + status;
        var removedStatus = activated ? prefixNot + status : prefixIs + status;
        s.logf(`toggleStatus: add ${addedStatus}, remove ${removedStatus}`);
        $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`).addClass(`${s.genClass(addedStatus)}`);
        $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`).removeClass(`${s.genClass(removedStatus)}`);
    }

    buildUI() {
        const s = this;
        s.logf(`buildUI`);

        // REBUILD TEMPLATE IF IT WAS REMOVED SOMEHOW
        if ($(`#${s.genId('template')}`).length === 0) {
            s.log(`rebuild template...`);
            s.buildTemplate();
        }

        var btnBox = $(s._config.ui.tags.btnBox);
        //if not btn box, create it
        if (btnBox.length === 0) {
            $('.o_form_sheet').prepend(`<div class="oe_button_box" name="button_box"></div>`);
        }

        var container = $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`);
        if (s.ui) {
            if (container.length) {
                s.log(`already have UI`);
                return false;
            }
        }

        s.log(`rebuild UI...`);
        $(s._config.ui.tags.btnBox).prepend(s.template.find(`#${s.genId('processActionBar')}`).clone(true));

        var ui = {
            statusBar: $(s._config.ui.tags.statusBar),
            btnBar: $(s._config.ui.tags.statusBar)
                .find(s._config.ui.tags.statusBarButtons),
            btnBox: $(s._config.ui.tags.btnBox),
            processActionBar: $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`)
        };

        //console.log($(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`));

        s.ui = ui;
        return true;
    }

    lockUI() {
        const s = this;
        s.logf(`lockUI`);
        s.toggleStatus(false, 'AccessRights', 'have', 'no');
        s.disableStatusBarButtons();
        s.disableObjectEditionButtons();
    }

    unlockUI() {
        const s = this;
        s.logf(`unlockUI`);
        s.toggleStatus(true, 'Loaded');
        s.enableStatusBarButtons();
        s.enableObjectEditionButtons();
        //s.removeControls();
    }

    enableStatusBarButtons() {
        const s = this;
        //  s.logf(`enableStatusBarButtons`);
        s.toggleItem($(s._config.ui.tags.statusBar), true);
        //$(".o_form_editable").removeClass("validationProcess_disabled_v2")
        s.toggleItem($(s._config.ui.tags.statusBar)
            .find(s._config.ui.tags.statusBarButtons), true);
    }

    disableStatusBarButtons() {
        const s = this;
        //  s.logf(`disableStatusBarButtons`);
        s.toggleItem($(s._config.ui.tags.statusBar), false);
        //$(".o_form_editable").addClass("validationProcess_disabled_v2")
        return s.toggleItem($(s._config.ui.tags.statusBar)
            .find(s._config.ui.tags.statusBarButtons), false);
    }

    enableObjectEditionButtons() {
        const s = this;
        // s.logf(`enableObjectEditionButtons`);
        $(".o_cp_action_menus").removeClass("validationProcess_disabled_v2")
        $(".o_form_editable").removeClass("validationProcess_disabled_v2")
        return s.toggleItem($(s._config.ui.tags.editionButtons), true);
    }

    disableObjectEditionButtons() {
        const s = this;
        // s.logf(`disableObjectEditionButtons`);
        
        $(".o_form_editable").addClass("validationProcess_disabled_v2")
        $(".o_cp_action_menus").addClass("validationProcess_disabled_v2")
        return s.toggleItem($(s._config.ui.tags.editionButtons), false);
    }

    disableValidationProcessButtons() {
        const s = this;
        //  s.logf(`disableValidationProcessButtons`);
        if (!s.ui)
            return false;
        return s.toggleItem($(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`), false);
    }

    enableValidationProcessButtons() {
        const s = this;
        //   s.logf(`enableValidationProcessButtons`);
        if (!s.ui)
            return false;
        return s.toggleItem($(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`), true);
    }

    removeControls() {
        const s = this;
        s.logf(`removeControls`);

        if (s.ui) {
            if ($(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`))
                $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`).remove();

            if (s.ui.processHistoryBar)
                s.ui.processHistoryBar.remove();
        }
        return true;
    }

    toggleItem(item, show = true) {
        const s = this;
        //  s.logf(`toggleItem`);

        if (!item)
            return false;

        let removedClass = `${s.genClass(show ? 'controlDisabled' : 'controlEnabled')}`;
        let addedClass = `${s.genClass(show ? 'controlEnabled' : 'controlDisabled')}`;
        item.removeClass(removedClass);
        item.addClass(addedClass);
        // console.log(item);
        //    console.log(removedClass, addedClass);
    }

    async autoConfirm() {
        const s = this;
        s.logf(`autoConfirm`);
        //s.enableValidationProcessButtons();
        return s.createExecutionStep('confirm', true);
        // $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`).find('#validationProcess_confirm').trigger('click');
    }

    async onDocumentChanged(id = false, model = false, view_type = false, force = false) {
        const s = this;
        s.logf(`onDocumentChanged`);


        // refresh the UI and build the process if needed
        if (!force && s.isRefreshing) {
            s.log(`Already refreshing`);
            await s.sleep(s._config.checkTimer * 2);
            return s.onDocumentChanged(id, model, view_type, force);
        }
        s.isRefreshing = true;

        // If the required conditions are not satisfied, destroy the UI = unlock it as it is not needed
        var cannotStartCondition = !view_type ||
            !model ||
            !id ||
            view_type !== 'form' ||
            model === false ||
            id == false;

        s.toggleStatus(!cannotStartCondition, 'Needed');
        if (cannotStartCondition) {
            s.destroy('NO_NEED');
            return false;
        }

        // set params
        s.id = parseInt(id);
        s.model = model;
        s.view_type = view_type;

        //build UI if needed
        s.buildUI();

        // mark the UI as not loaded until end of refresh
        s.toggleStatus(false, 'Loaded');

        // get current process
        s.process = await s.setValidationProcessData(s.model);

        // stop if no process for this model
        s.toggleStatus(s.process, 'Process', 'have', 'no');
        if (!s.process)
            return s.destroy('NO_PROCESS');

        // if no steps for this process we consider it as confirmed, not blocking.
        s.toggleStatus(s.process.steps.length > 0, 'Steps', 'have', 'no');
        if (s.process.steps.length === 0)
            return s.destroy('NO_STEP');

        // there is a process with steps, lock the UI while we check for executions status
        s.lockUI();

        //in case this is a new item we set the id to -1
        if (s.id < 0) {
            s.toggleStatus(false, 'AccessRights', 'have', 'no');
            s.toggleStatus(true, 'Loaded');
            s.enableObjectEditionButtons();
            return false;
        }

        // active executions
        s.log(`Get active execution...`);
        s.execution = await s.getActiveExecution(s.id, s.process.id);

        // if no execution, create one if:
        //  the current object matches the domain of process activation
        if (!s.execution) {
            s.log(`No execution available, check if should create one`);

            let triggeredProcessStart = await s.matchDomain(
                s.id,
                s.model,
                JSON.parse(s.process[s._config.processFields.startConditionDomain]),
                JSON.parse(s.process[s._config.processFields.filterDomain]));

            s.toggleStatus(triggeredProcessStart, 'Started');

            if (triggeredProcessStart) {
                s.log(`Object triggered start condition, create execution on first step`);
                s.execution = await s.createExecution(
                    s.id,
                    s.process.id,
                    s.process.steps[0].id
                );

                // Get the latest executions, instead of using the one we just created
                // we request all of them again to handle potential concurrent activation
                s.execution = await s.getActiveExecution(s.id, s.process.id);

                if (!s.execution) {
                    s.handleError(
                        'EXECUTION_CREATION_FAIL',
                        'Failed to initiate the process #' + s.process.id + " on obj " + s.id);
                    return false;
                }
            }
            else {
                // we have a process with steps, but it did not trigger the 
                // process start, so nothing to show.
                return s.destroy('PROCESS_NOT_STARTED');
            }
        }

        s.log(`There is an active execution`);

        //Set css classes based on status of execution
        s.toggleStatus(true, 'Started');
        s.toggleStatus(s.execution.isFinal, 'Final');
        s.toggleStatus(s.execution.isCancelled, 'Cancelled');
        s.toggleStatus(s.execution.nextStep, 'NextStep', 'have', 'no');
        s.toggleStatus(s.execution.prevStep, 'PrevStep', 'have', 'no');
        s.toggleStatus(s.execution.step.buttons_back, 'BtnBack', 'allow', 'forbid');
        s.toggleStatus(s.execution.step.buttons_reset, 'BtnReset', 'allow', 'forbid');
        s.toggleStatus(s.execution.step.rules.length, 'Rules', 'have', 'no');


        //re-enable or not the edition based on process / step specific config
        if (s.execution.step.disable_edit) {
            s.log('Step requires to disable edition... make sure to disable it');
            s.disableObjectEditionButtons();
        }
        else {
            s.log('Step does not require to disable edition... re-enable');
            s.enableObjectEditionButtons();
        }

        //change the step name on confirm button
        s.changeConfirmBtnName(s.execution.step[s._config.stepFields.name]);

        //async build the history/info bar so the rest keeps loading
        s.buildInfoBar().then(d => { }).catch(err => { }).finally(() => {
            s.buildHistoryBar().then(d => { }).catch(err => { });
        });

        // in case the execution is finished and was approved
        if (s.execution.isFinal) {
            //check if the process allow a restart after approved
            if (s.process.allow_restart_after_approved) {

                // if so, then restart
                let triggeredProcessStart = await s.matchDomain(
                    s.id,
                    s.model,
                    JSON.parse(s.process[s._config.processFields.startConditionDomain]),
                    JSON.parse(s.process[s._config.processFields.filterDomain]));

                s.toggleStatus(triggeredProcessStart, 'RestartAllowed');
            }

            //if the process has been confirmed, then enable buttons
            s.toggleStatus(true, 'Loaded');
            s.unlockUI();
            return true;
        }

        // in case the execution is finished and was cancelled
        if (s.execution.isCancelled) {

            //check if the process allow a restart after cancelled
            if (s.process.allow_restart_after_cancelled) {

                //if so, then restart
                let triggeredProcessStart = await s.matchDomain(
                    s.id,
                    s.model,
                    JSON.parse(s.process[s._config.processFields.startConditionDomain]),
                    JSON.parse(s.process[s._config.processFields.filterDomain]));

                s.toggleStatus(triggeredProcessStart, 'RestartAllowed');
            }

            //if the process has been confirmed, then enable buttons
            s.toggleStatus(true, 'Loaded');
            s.unlockUI();
            return true;
        }

        //if no rules
        if (s.execution.step.rules.length === 0) {

            // if the step is set to allow anyone to confirm if no condition
            s.toggleStatus(s.execution.step.allow_anyone_no_conditions, 'AccessRights', 'have', 'no');

            if (s.execution.step.allow_anyone_no_conditions) {
                s.log(`No rules: allow_anyone_no_conditions is set to true`);

                // if step is set to allow auto_confirm when no condition
                if (s.execution.step.auto_confirm_no_conditions) {
                    s.log(`No active rules: allow_anyone_no_conditions is set to true`);

                    s.toggleStatus(true, 'Loaded');
                    return s.autoConfirm();
                }
            }

            s.toggleStatus(true, 'Loaded');
            s.enableValidationProcessButtons();
            return false;
        }

        // get active rules
        var haveActiveRules = await s.checkIfAnyRuleIsActive(s.execution.step.rules);
        s.toggleStatus(haveActiveRules, 'ActiveRules', 'have', 'no');

        // No active rule: means we have no conditions on this step's validation
        if (!haveActiveRules) {
            s.log(`No active rules: no one can confirm this step unless specified`);

            // if auto confirm is on
            if (s.execution.step.auto_confirm_no_active_rules) {
                s.log(`No active rules: auto_confirm_no_active_rules is set to true`);

                s.toggleStatus(true, 'Loaded');
                s.autoConfirm();
                return true;
            }

            s.toggleStatus(true, 'Loaded');
            s.enableValidationProcessButtons();
            return false;
        }

        // for all rules, check if the user is authorized
        s.log(`There are active rules, get rules user is authorized and check if any of it is active`);
        var rulesWhereUserIsAuthorized = s.filterRulesWhereUserIsAuthorized(
            s.execution.step.rules,
            s.user.id
        );

        //if the user is not authorized on any
        if (rulesWhereUserIsAuthorized.length === 0) {
            s.log(`No rules where user is authorized`);
            s.toggleStatus(false, 'AccessRights', 'have', 'no');

            s.toggleStatus(true, 'Loaded');
            s.enableValidationProcessButtons();
            return false;
        }

        s.log(`There are ${rulesWhereUserIsAuthorized.length} rules where user is authorized`);
        var userAuthorizedOnActiveRules = await s.checkIfAnyRuleIsActive(rulesWhereUserIsAuthorized);

        if (!userAuthorizedOnActiveRules) {
            s.log(`No active rules where user is authorized`);
            s.toggleStatus(false, 'AccessRights', 'have', 'no');
            s.toggleStatus(true, 'Loaded');
            return false;
        }

        s.log(`Some rules where user is authorized are active`);
        s.toggleStatus(true, 'AccessRights', 'have', 'no');

        //if we have access rights, enable the controls
        s.enableValidationProcessButtons();
        s.toggleStatus(true, 'Loaded');
        return true;
    }

    // set params back to false
    resetParams() {
        const s = this;
        s.id = false;
        s.model = false;
        s.hasFormEditBtn = false;
        s.hasFormSaveBtn = false;
    }

    // error management, will stop the module once executed
    handleError(code, e) {
        const s = this;
        //s.isDisabled = true;
        //clearInterval(s.loop);
        //s.loop = null;

        s.destroy(code);
        s.toggleStatus(true, 'ShowError', 'must', 'no');
        console.error(code, e);
        console.log('An error occurred, must refresh to resume.')
        //throw new Error(code, e);
        return false;
    }




    // Get relevant process data
    async setValidationProcessData(model) {
        const s = this;
        //s.logf(`setValidationProcessData`);

        // get all active processes, avoid too many requests
        if (!s._cache['processes'])
            await s.setProcessCache();

        // filter only the model we want
        var processes = s._cache.processes.filter(p => (p[s._config.processFields.modelName] === model));

        if (processes.length == 0)
            return false;

        if (processes.length > 1) {
            s.handleError(
                'MULTIPLE_PROCESS_ONE_MODEL',
                'More than one process on model ' + s._config.processFields.modelName);
            return false;
        }
        var process = processes[0];

        if (!s._cache['steps'])
            await s.setStepCache();

        // get all related steps, avoid too many requests
        process['steps'] = s._cache['steps'].filter(step => {
            return step[s._config.stepFields.process][0] === process.id
        });

        if (!s._cache['rules'])
            await s.setRuleCache();

        // get all related rules at once, avoid too many requests
        var rules = s._cache.rules.filter(r => {
            return process['steps']
                .map(step => step.id)
                .includes(r[s._config.ruleFields.step][0]);
        });

        if (!s._cache['users'])
            await s.setUserCache();

        var users = s._cache['users'];

        // attach users to rules
        rules = rules
            .map(rule => {
                rule['users'] =
                    rule[s._config.ruleFields.authorizedUsers]
                        .map(userId => {
                            let matchedUser = users
                                .filter(item => item.id === userId);
                            return matchedUser[0] ? matchedUser[0] : false;
                        });
                return rule;
            });

        // attach rules to steps
        process.steps = process.steps
            .map(step => {
                step['rules'] =
                    rules.reduce((prev, rule) => {
                        if (rule[s._config.ruleFields.step][0] === step.id)
                            prev.push(rule);
                        return prev;
                    }, []);
                return step;
            });

        return process;
    }

    // retrieve a collection of models from Odoo
    // async search(model = false, fields = [], domain = false, offset = 0, limit = 5, order = false) {
    //     return this.searchLegacy(model, fields, domain, offset, limit, order);
    // }
    // get executions for the current object
    async getActiveExecution(objId, processId) {
        const s = this;
        //s.logf(`getActiveExecutions for #${id}`);

        var executions = await s.searchLegacy(s._config.executionModel, [], [
            [s._config.executionFields.process, '=', processId],
            [s._config.executionFields.targetId, '=', objId],
            [s._config.executionFields.active, '=', true]
        ], 0);

        if (executions.length === 0)
            return false;

        if (executions.length > 1) {
            s.handleError(
                'MULTIPLE_EXECUTION_ONE_OBJECT',
                'More than one process on object #' + objId + " for process " + processId + " = " + JSON.stringify(executions));
            return false;
        }

        var execution = executions[0];
        for (var j = 0; j < s.process.steps.length; j++) {
            if (execution[s._config.executionFields.step][0] === s.process.steps[j].id) {
                execution['step'] = s.process.steps[j] || false;
                execution['stepIndex'] = j;
                //execution['nextNextStep'] = s.process.steps[j + 2] || false;
                execution['nextStep'] = s.process.steps[j + 1] || false;
                execution['prevStep'] = s.process.steps[j - 1] || false;
            }
        }

        execution['process'] = s.process;
        execution['steps'] = s.process.steps;

        execution['isFinal'] = execution[s._config.executionFields.isFinal];
        execution['isCancelled'] = execution[s._config.executionFields.isCancelled];

        execution['messages'] = await s.searchLegacy('mail.message', [], [
            ['id', '=', execution.message_ids]
        ], 0, 100, 'id asc');

        execution['trackings'] = await s.searchLegacy('mail.tracking.value', [], [
            ['mail_message_id', '=', execution.message_ids]
        ], 0, 100, 'id asc');

        execution['track_fields'] = await s.searchLegacy('ir.model.data', [],[
            ['name','in',['field_fal_vprocess_execution__step_id','field_fal_vprocess_execution__finished','field_fal_vprocess_execution__cancelled']]
        ])
        // console.log(execution['trackings']);

        execution['history'] = execution['trackings'].map(track => {
            var output = [];
            var step_id_field = 0
            var finish_field = 0
            var cancel_field = 0
            for(var index = 0; index < execution['track_fields'].length; index++){
                if ((execution['track_fields'][index]).name == 'field_fal_vprocess_execution__step_id'){
                    step_id_field = (execution['track_fields'][index]).res_id
                }else if ((execution['track_fields'][index]).name == 'field_fal_vprocess_execution__finished'){
                    finish_field = (execution['track_fields'][index]).res_id
                }else if ((execution['track_fields'][index]).name == 'field_fal_vprocess_execution__finished'){
                    cancel_field = (execution['track_fields'][index]).res_id
                }
            }
            if (track.field_id[0] === step_id_field) {
                // 'step_id'
                output.push(`${track.field_id[1].toUpperCase() + ": "}`);


                if (track.old_value_char)
                    output.push(`${track.old_value_char + " "}<span aria-label="Changed" class="fa fa-long-arrow-right" role="img" title="Changed"></span>` + " ");

                output.push(`${track.new_value_char}`);
            }


            // if (track.field === 'finished' or 'cancelled') {
            if (track.field_id[0] === finish_field || track.field_id[0] === cancel_field) {
                output.push(`${track.field_id[1].toUpperCase() + ": "} ${(track.new_value_integer === 1 ? 'True' : 'False')}`);
            }

            // if (track.field === 'cancelled') {
//            if (track.field_id[0] === 7180) {
//                output.push(`${track.field_id[1].toUpperCase() + ": "} ${(track.new_value_integer === 1 ? 'True' : 'False')}`);
//            }

            //get related message to get author
            let trackingMsg = execution['messages'].filter(m => { return track.mail_message_id[0] === m.id; });
            // console.log(trackingMsg);

            trackingMsg = (trackingMsg.length > 0) ? trackingMsg[0] : false;
            var author = false;

            if (trackingMsg && trackingMsg.author_id.length > 0) {
                author = trackingMsg.author_id[1] || ('User #' + trackingMsg.author_id[0]);
                // console.log(author);
                if (author.toString().includes(',')) {
                    author = author.split(',')[1];
                    // console.log(author);
                }
            }
            // console.log(author);
            var myDate = new Date(trackingMsg.write_date);
            myDate.setHours(myDate.getHours() + 8);
            s.log(`myDate: ${myDate.toString()}`)
            return {
                date: s.formatDate(myDate),
                content: output.join(" "),
                author: author
            };
        });

        if (!execution['step']) {
            s.handleError(
                'NO_STEP_FOR_ACTIVE_EXECUTION',
                'No step for the execution #' + execution.id + " on obj " + objId + " for process " + processId);
            return false;
        }

        return execution;
    }

    formatDate(current_datetime) {
        const s = this;
        s.logf(`formatDate: ${current_datetime.toString()}`);
        //return current_datetime;
        return current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1).toString().padStart(2, "0") + "-" + current_datetime.getDate().toString().padStart(2, "0") + " " + current_datetime.getHours().toString().padStart(2, "0") + ":" + current_datetime.getMinutes().toString().padStart(2, "0") + ":" + current_datetime.getSeconds().toString().padStart(2, "0");
    }

    changeConfirmBtnName(name) {
        const s = this;
        s.logf(`changeConfirmBtnName: ${name}`);
        $(s._config.ui.tags.btnBox).find(`#${s.genId('processActionBar')}`).find('#validationProcess_confirm').find('.' + s.genClass('title')).text(name);
    }

    async buildHistoryBar() {
        const s = this;
        s.logf(`buildHistoryBar`);

        if (s.ui) {
            if (s.ui.processHistoryBar)
                s.ui.processHistoryBar.remove();
        }

        $(`<div 
                id="${s.genId('processHistoryBar')}"
                class="${s.genClass('processHistoryBar')} clearfix">
            </div>`).insertAfter($(s._config.ui.tags.btnBox));

        s.ui['processHistoryBar'] = $('#' + s.genId('processHistoryBar'));
        s.ui['processHistoryStepBars'] = [];

        //console.log(s.execution['history']);

        s.execution['history'].map((log, index) => {
            var barId = 'processHistoryStepBar_' + index;

            s.ui.processHistoryBar
                .append(
                    `<div 
                    id="${s.genId(barId)}"
                    class="o_not_full oe_button_box ${s.genClass(['processHistoryStepBar', 'light_grey_bg'])} clearfix">
                </div>`);

            var barObject = s.ui.processHistoryBar
                .find('#' + s.genId(barId));

            s.ui['processHistoryStepBars'].push(barObject);

            barObject.append(s.btnGen({
                title: `${log.author}`,
                subtitle: `${log.date}`,
                name: `processHistoryBar_log_${index}`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'historyBtn'
            }));
            barObject.append(s.btnGen({
                title: log.content,
                subtitle: false,
                name: `processHistoryBar_log_${index}`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'historyBtn'
            }));

        });
        return true;
    }

    async buildInfoBar() {
        const s = this;
        s.logf(`buildInfoBar`);

        if (s.ui) {
            if (s.ui.processInfoBar)
                s.ui.processInfoBar.remove();
        }

        $(`<div 
                id="${s.genId('processInfoBar')}"
                class="${s.genClass('processInfoBar')} clearfix">
            </div>`).insertAfter($(s._config.ui.tags.btnBox));
        //formTitle

        s.ui['processInfoBar'] = $('#' + s.genId('processInfoBar'));
        s.ui['processInfoStepBars'] = [];

        s.process.steps.map((step, index) => {
            var barId = 'processInfoStepBar_' + index;
            var isCurrentStep = (!s.execution.isFinal && !s.execution.isCancelled) && (s.execution['step'].id === step.id);
            var additionalClass = `${isCurrentStep ? s.genClass('light_blue_bg') : s.genClass('light_grey_bg')}`;

            var disable_edit = step.disable_edit;
            var disable_actions = step.disable_actions;
            var auto_confirm_no_conditions = step.auto_confirm_no_conditions;
            var allow_anyone_no_conditions = step.allow_anyone_no_conditions;
            var auto_confirm_no_active_rules = step.auto_confirm_no_active_rules;
            var enable_activity = step.enable_activity;
            var buttons_back = step.buttons_back;
            var buttons_reset = step.buttons_reset;
            var action_strings = step.action_string_confirm !== "" || step.action_string_reset !== "";
            var field_strings = step.field_string_confirm !== "" || step.field_string_cancel !== "" || step.field_string_back !== "" || step.field_string_reset !== "";


            // build legend
            var stepSubtitle = [];
            stepSubtitle.push(disable_edit ? '<i class="fa fa-edit fal-strikethrough" title="Edition disabled"></i>' : '<i class="fa fa-edit" title="Edition enabled"></i>');
            stepSubtitle.push(disable_actions ? '<i class="fa fa-bars fal-strikethrough" title="Actions disabled"></i>' : '<i class="fa fa-bars" title="Actions enabled"></i>');
            stepSubtitle.push(auto_confirm_no_conditions ? '<i class="fa fa-arrow-circle-o-right" title="Auto confirm if no conditions"></i>' : '<i class="fa fa-arrow-circle-o-right fal-strikethrough" title="Do not auto confirm if no conditions"></i>');
            stepSubtitle.push(allow_anyone_no_conditions ? '<i class="fa fa-user-circle" title="Allow anyone if no conditions"></i>' : '<i class="fa fa-user-circle fal-strikethrough" title="Do not allow anyone if no conditions"></i>');
            stepSubtitle.push(auto_confirm_no_active_rules ? '<i class="fa fa-arrow-circle-right" title="Auto confirm if no active rules"></i>' : '<i class="fa fa-arrow-circle-right fal-strikethrough" title="Do not auto confirm if no active rules"></i>');
            stepSubtitle.push(enable_activity ? '<i class="fa fa-envelope" title="Enable activities"></i>' : '<i class="fa fa-envelope fal-strikethrough" title="Activities disbled"></i>');
            stepSubtitle.push(buttons_back ? '<i class="fa fa-arrow-left" title="Allow back button"></i>' : '<i class="fa fa-arrow-left fal-strikethrough" title="Do not allow back button"></i>');
            stepSubtitle.push(buttons_reset ? '<i class="fa fa-refresh" title="Allow reset button"></i>' : '<i class="fa fa-refresh fal-strikethrough" title="Do not allow reset button"></i>');
            stepSubtitle.push(action_strings ? '<i class="fa fa-magic" title="Perform automatic actions"></i>' : '<i class="fa fa-magic fal-strikethrough" title="Do not perform automatic actions"></i>');
            stepSubtitle.push(field_strings ? '<i class="fa fa-i-cursor" title="Perform fields updates"></i>' : '<i class="fa fa-i-cursor fal-strikethrough" title="Do not perform fields updates"></i>');

            var buttons = [{
                title: '#' + index,
                subtitle: '',
                name: `processInfoBar_step_${step.id}_handle`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }, {
                title: step[s._config.stepFields.name] || 'step',
                subtitle: stepSubtitle.join(""),
                name: `processInfoBar_step_${step.id}_title`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }];

            //'padding-left:10px;width:180px;'
            if (step.rules.length > 0) {
                step.rules.map(rule => {
                    buttons.push({
                        title: rule[s._config.ruleFields.name] || 'rule name',
                        subtitle: rule['users'].map(u => u.name).join(',') || 'All users',
                        name: 'processInfoBar_step_' + step.id + '_' + `rule_${rule.id}`,
                        color: 'black',
                        icon: false,
                        styleBtn: '',
                        className: 'infoBtn'
                    });
                });
            }

            // create bars
            var barObject = false;
            var index = 0;
            var barIndex = 0;
            buttons.map((btn) => {
                if (index % 6 === 0) {
                    barIndex = barIndex + 1;
                    s.ui.processInfoBar
                        .append(
                            `<div 
                    id="${s.genId(barId)}_${barIndex}"
                    class="o_not_full oe_button_box ${s.genClass('processInfoStepBar')} ${additionalClass} clearfix">
                </div>`);

                    barObject = s.ui.processInfoBar
                        .find('#' + s.genId(barId) + "_" + barIndex);
                    s.ui['processInfoStepBars'].push(barObject);

                    if (index > 0) {
                        barObject.append(s.btnGen({
                            title: ' ',
                            subtitle: '',
                            name: `processInfoBar_step_${step.id}_handle`,
                            color: 'black',
                            icon: false,
                            styleBtn: '',
                            className: 'infoBtn'
                        }));
                        barObject.append(s.btnGen({
                            title: ' ',
                            subtitle: ' ',
                            name: `processInfoBar_step_${step.id}_title`,
                            color: 'black',
                            icon: false,
                            styleBtn: '',
                            className: 'infoBtn'
                        }));
                        index = index + 2;
                    }
                }
                barObject.append(s.btnGen(btn));
                index++;
            });
        });


        if (s.execution.isFinal) {
            var barId = 'processInfoStepBar_isFinal';
            s.ui.processInfoBar
                .append(
                    `<div 
                    id="${s.genId(barId)}"
                    class="o_not_full oe_button_box ${s.genClass('processInfoStepBar')} ${s.genClass('light_green_bg')} clearfix">
                </div>`);

            var barObject = s.ui.processInfoBar
                .find('#' + s.genId(barId));

            s.ui['processInfoStepBars'].push(barObject);

            var buttons = [{
                title: 'END',
                subtitle: '',
                name: `processInfoBar_step_isFinal_handle`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }, {
                title: 'Approved',
                subtitle: 'finished',
                name: `processInfoBar_step_isFinal_title`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }];
            buttons.map(btn => {
                barObject.append(s.btnGen(btn));
            });
        }


        if (s.execution.isCancelled) {
            var barId = 'processInfoStepBar_isCancelled';
            s.ui.processInfoBar
                .append(
                    `<div 
                    id="${s.genId(barId)}"
                    class="o_not_full oe_button_box ${s.genClass('processInfoStepBar')} ${s.genClass('light_red_bg')} clearfix">
                </div>`);

            var barObject = s.ui.processInfoBar
                .find('#' + s.genId(barId));

            s.ui['processInfoStepBars'].push(barObject);
            var buttons = [{
                title: 'END',
                subtitle: '',
                name: `processInfoBar_step_isCancelled_handle`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }, {
                title: 'Cancelled',
                subtitle: 'finished',
                name: `processInfoBar_step_isCancelled_title`,
                color: 'black',
                icon: false,
                styleBtn: '',
                className: 'infoBtn'
            }];
            buttons.map(btn => {
                barObject.append(s.btnGen(btn));
            });
        }


        return true;
    }

    async handleClick(name, el) {
        const s = this;
        s.logf(`handleClick: ${name}`);

        if(!$(".o_form_status_indicator_buttons").hasClass("invisible")){
            s.log(` ... autosave`);
            $(".o_form_button_save").click()
            await s.sleep(1000);
        }

        //disable controls while processing
        s.disableValidationProcessButtons();

        // Show the icon as loading
        el.find('i.fa')
            .addClass('fa-spinner')
            .addClass('fa-spin');

        var mustRefresh = false;
        //var mustReload = false;
        switch (name) {
            case 'info':
                if (s.ui.processHistoryBar && s.ui.processHistoryBar.is(':visible')) {
                    await (new Promise(res => {
                        s.ui.processHistoryBar.animate({
                            opacity: "toggle",
                        }, 250, function () {
                            // Animation complete.
                            res(true);
                        });
                    }));
                }

                if (s.ui.processInfoBar)
                    await (new Promise(res => {
                        s.ui.processInfoBar.animate({
                            opacity: "toggle",
                        }, 250, function () {
                            // Animation complete.
                            res(true);
                        });
                    }));
                break;
            case 'history':

                if (s.ui.processInfoBar && s.ui.processInfoBar.is(':visible')) {
                    await (new Promise(res => {
                        s.ui.processInfoBar.animate({
                            opacity: "toggle",
                        }, 250, function () {
                            // Animation complete.
                            res(true);
                        });
                    }));
                }


                if (s.ui.processHistoryBar)
                    await (new Promise(res => {
                        s.ui.processHistoryBar.animate({
                            opacity: "toggle",
                        }, 250, function () {
                            // Animation complete.
                            res(true);
                        });
                    }));
                break;

            case 'confirm':
                await s.createExecutionStep(name, true);
                break;

            case 'cancel':
                await s.createExecutionStep(name, true);
                break;

            case 'back':
                await s.createExecutionStep(name, true);
                break;

            case 'restart':
                await s.createExecutionStep(name, true);
                break;

            default:
                break;
        }

        el.find('i.fa')
            .removeClass('fa-spinner')
            .removeClass('fa-spin');


        s.enableValidationProcessButtons();

        return true;
    }

    filterRulesWhereUserIsAuthorized(rules, userId) {
        const s = this;
        s.logf(`filterRulesWhereUserIsAuthorized`);

        // user is authorized on a rule in 2 cases
        // - if there is no user set on the rule = everyone is allowed
        // - if there are users set on rule, it must be one of them

        return rules.reduce((prev, rule) => {
            if (rule[s._config.ruleFields.authorizedUsers].length === 0 ||
                rule[s._config.ruleFields.authorizedUsers].includes(userId)) {
                prev.push(rule);
            }
            return prev;
        }, [])
    }

    async getActiveRules(rulesToCheck = false) {
        const s = this;
        s.logf(`getActiveRules`);

        if (!rulesToCheck)
            rulesToCheck = s.execution.step.rules;

        // a master domain is built to only execute 1 query.
        var rules = [];
        for (var i = 0; i < rulesToCheck.length; i++) {
            let rule = rulesToCheck[i];
            let matched = await s.matchDomain(
                s.id,
                s.model,
                JSON.parse(rule[s._config.ruleFields.applyOnDomain]),
                JSON.parse(s.process[s._config.processFields.filterDomain])
            );
            if (matched) {
                rules.push(rule);
            }
        }
        return rules;
    }

    async checkIfAnyRuleIsActive(rulesToCheck = false) {
        const s = this;
        s.logf(`checkIfAnyRuleIsActive`);

        if (!rulesToCheck)
            rulesToCheck = s.execution.step.rules;

        // a master domain is built to only execute 1 query.
        var masterDomain = [];
        var prefix = [];
        for (var i = 0; i < rulesToCheck.length; i++) {
            let rule = rulesToCheck[i];
            let ruleDomain = JSON.parse(rule[s._config.ruleFields.applyOnDomain])
            /*let matched = await s.matchDomain(
                s.id,
                s.model,
                JSON.parse(rule[s._config.ruleFields.applyOnDomain]),
                JSON.parse(s.process[s._config.processFields.filterDomain])
            );
            if (matched) {
                rules.push(rule);
            }*/

            // console.log("rule", rule)
            if (rule[s._config.ruleFields.applyOnDomain]) {
                // if (i > 0)
                //     prefix.push("|");
                // masterDomain = masterDomain.concat(ruleDomain)
                let matched = await s.matchDomain(
                    s.id,
                    s.model,
                    ruleDomain,
                    JSON.parse(s.process[s._config.processFields.filterDomain])
                )
                if(matched){
                    return true
                    break
                }
            } else {
                // masterDomain = masterDomain.concat([])
            }
        }
        return false;

        masterDomain = prefix.concat(masterDomain);

        return s.matchDomain(
            s.id,
            s.model,
            masterDomain,
            JSON.parse(s.process[s._config.processFields.filterDomain])
        );
    }

    async matchDomain(id, model, domain = [], superDomain = false) {
        const s = this;
        s.logf(`matchDomain`);
        // console.log("domain", domain)
        // console.log("superDomain", superDomain)
        if (!id || id === 0)
            return false;

        var prefix = [];

        if (!Array.isArray(domain))
            domain = [];

        if (!Array.isArray(superDomain))
            superDomain = [];

        if (domain.length > 0) {
            prefix.push("&");
        }

        if (superDomain.length > 0) {
            prefix.push("&");
        }

        var theDomain = superDomain.concat(domain);

        theDomain = prefix
            .concat([
                ["id", "=", parseInt(id)]
            ])
            .concat(theDomain);
            
            if(theDomain[theDomain.length -1] == "|"){
                theDomain.pop()
            }

            if(theDomain.length == 2){
                theDomain.shift()
            }

        s.log(`theDomain is ${JSON.stringify(theDomain)}`);
        // console.log(theDomain);
        //results should return the current id
        var matches = await s.searchLegacy(model, ['id'], theDomain, 0, 1);
        //console.log(matches);
        return (matches.length > 0) &&
            (matches[0].id.toString() === id.toString());
    }

    async createExecution(id, processId, stepId) {
        const s = this;
        s.logf(`createExecution`);
        var item = {};
        item[s._config.executionFields.name] = `[object #${id}]` + " Start process #" + processId + " at " + s.now_toLocaleString();
        item[s._config.executionFields.targetId] = id;
        item[s._config.executionFields.process] = processId;
        item[s._config.executionFields.step] = stepId;
        item[s._config.executionFields.active] = true;
        item[s._config.executionFields.isFinal] = false;

        try {
            item['id'] = await s.createUpdate(s._config.executionModel, item);
        }
        catch (err) {
            console.error(err)
            s.handleError('CREATE_EXECUTION_FAIL');
        }

        console.log(item)

        return item;
    }

    async createExecutionStep(action = false, allowDocumentRefresh = false) {
        const s = this;
        s.log(`---`);
        s.log(`---`);
        s.logf(`createExecutionStep: ${action}`);
        var item = {};
        var mustUpdate = true;
        var mustRefresh = false;
        var actionToExecute = false;
        var fieldsToUpdate = false;

        s.toggleStatus(true, 'ShowLoader', 'must', 'no');

        switch (action) {
            case 'confirm':
                if (s.execution.nextStep) {
                    item[s._config.executionFields.step] = s.execution.nextStep.id;
                }
                item[s._config.executionFields.previousStep] = s.execution.step.id;
                item[s._config.executionFields.lastAction] = action;

                //if we have an action, refresh page
                actionToExecute = s.execution.step.action_string_confirm;
                fieldsToUpdate = s.execution.step.field_string_confirm;
                //item[s._config.executionFields.stepSequence] = s.execution.nextStep["sequence"];

                if (!s.execution.nextStep) {
                    item[s._config.executionFields.isFinal] = true;
                    mustRefresh = true;
                }
                break;

            case 'back':
                if (s.execution.prevStep) {
                    item[s._config.executionFields.step] = s.execution.prevStep.id;
                    item[s._config.executionFields.previousStep] = s.execution.step.id;
                    item[s._config.executionFields.lastAction] = action;
                    actionToExecute = s.execution.step.action_string_back;
                    fieldsToUpdate = s.execution.step.field_string_back;
                    //item[s._config.executionFields.stepSequence] = s.execution.prevStep["sequence"];
                }
                else {
                    mustUpdate = false;
                }
                break;

            case 'restart':
                item[s._config.executionFields.step] = s.process.steps[0].id;
                item[s._config.executionFields.previousStep] = s.execution.step.id;
                item[s._config.executionFields.lastAction] = action;
                item[s._config.executionFields.isCancelled] = false;
                item[s._config.executionFields.isFinal] = false;
                actionToExecute = s.execution.step.action_string_reset;
                fieldsToUpdate = s.execution.step.field_string_reset;
                mustRefresh = true;
                break;

            case 'cancel':
                //item[s._config.executionFields.active] = true;
                item[s._config.executionFields.isCancelled] = true;
                item[s._config.executionFields.previousStep] = s.execution.step.id;
                item[s._config.executionFields.lastAction] = action;
                actionToExecute = s.execution.step.action_string_cancel;
                fieldsToUpdate = s.execution.step.field_string_cancel;
                break;

            default:
                mustUpdate = false;
                break;
        }

        if (!mustUpdate) {
            s.toggleStatus(false, 'ShowLoader', 'must', 'no');
            return false;
        }


        if (actionToExecute) {
            var parts = actionToExecute.split(',');
            //console.log(parts);

            for (var i = 0; i < parts.length; i++) {
                try {
                    s.log(`Action to execute: ${parts[i]}`);
                    console.log(s)
                    var query = {
                        model: s.execution.process_model,
                        method: parts[i],
                        args: [
                            parseInt(s.id)
                        ]
                    };
                    var results = await s.ORM.call(query['model'], query['method'], query['args']);
                    s.log(`Action results: ${results}`)
                }
                catch (err) {
                    return s.handleError('TRIGGER_ACTION_FAIL', err);
                }
            }
        }

        if (fieldsToUpdate) {
            var hasFieldsToUpdate = false;
            var currentObject = fieldsToUpdate
                .split(',')
                .reduce((prev, f) => {
                    let fParts = f.split('=');
                    if (fParts.length === 2) {
                        prev[fParts[0]] = fParts[1];
                        hasFieldsToUpdate = true;
                    }
                    return prev;
                }, {});

            if (hasFieldsToUpdate) {
                currentObject['id'] = parseInt(s.id);
                //console.log(currentObject);
                try {
                    await s.createUpdate(s.execution.process_model, currentObject);
                }
                catch (err) {
                    return s.handleError('UPDATE_FIELD_FAIL', err);
                }
            }

        }

        //update the current execution state
        item['id'] = s.execution.id;

        try {
            await s.createUpdate(s._config.executionModel, item);
        }
        catch (err) {
            return s.handleError('UPDATE_EXECUTION_FAIL', err);
        }

        // insert message
        if (s.process.log_message_to_object) {
            try {
                await s.createMessage(
                    `${s.process.name}:${" "}${action.toUpperCase()}${" "}step${" "}${s.execution.step.name}`,
                    s.execution.process_model,
                    parseInt(s.execution.target));
            }
            catch (err) {
                return s.handleError('INSERT_MESSAGE_FAIL', err);
            }
        }

        // activity
        if (s.execution.step.enable_activity) {
            s.log(`Close previous activities...`);
            try {
                await s.closePreviousActivies(
                    parseInt(s.process.model_id[0]),
                    parseInt(s.execution.target)
                );
            }
            catch (err) {
                return s.handleError('CLOSE_ACTIVITY_FAIL', err);
            }

            var updateActivities = false;
            var nextExecutionStep = false;
            var nextAuthorizedUsers = [];

            //set activities for next step
            if (action === 'confirm') {
                if (s.execution.nextStep) {
                    updateActivities = true;
                    nextExecutionStep = s.execution.nextStep;

                    var nextActiveRules = await s.getActiveRules(nextExecutionStep.rules);
                    nextAuthorizedUsers = nextActiveRules.reduce((prev, r) => {
                        return prev.concat(r.user_ids);
                    }, []);
                    //console.log('confirm', nextAuthorizedUsers);
                }
            }
            //console.log(s.execution)

            // set activities for the prevStep which is becoming the new step
            if (action === 'back') {
                s.log(`activities back`);
                updateActivities = true;
                nextExecutionStep = s.execution.prevStep;

                var lastModifiedUser = s.execution.write_uid ? s.execution.write_uid[0] : false;
                if (s.execution.stepIndex === 1) {
                    lastModifiedUser = s.execution.create_uid ? s.execution.create_uid[0] : false;
                }

                if (lastModifiedUser)
                    nextAuthorizedUsers = [lastModifiedUser];
            }

            // if we reset, means back to step 0, whic his the request = no activities
            if (action === 'restart') {
                s.log(`activities restart`);
                updateActivities = true;
                nextExecutionStep = s.execution.steps.length > 0 ? s.execution.steps[0] : false;
                var firstCreatedUser = s.execution.create_uid ? s.execution.create_uid[0] : false;

                if (firstCreatedUser)
                    nextAuthorizedUsers = [firstCreatedUser];
            }

            //console.log(nextAuthorizedUsers);

            if (updateActivities) {
                s.log(`Set new activities... for step ${nextExecutionStep.name}`);

                //if no user, select the current one
                if (nextAuthorizedUsers.length === 0) {
                    nextAuthorizedUsers = [s.user.id];
                    s.log(`No user, set current user for activity`);
                }

                try {
                    for (var i = nextAuthorizedUsers.length; i--;) {
                        await s.createActivity(
                            `Document pending approval.<br />${s.process.name}${" "}-${" "}${nextExecutionStep.name}`,
                            `Document pending approval. ${s.process.name}${" "}-${" "}${nextExecutionStep.name}`,
                            parseInt(nextAuthorizedUsers[i]),
                            parseInt(s.process.model_id[0]),
                            parseInt(s.execution.target)
                        );
                    }
                }
                catch (err) {
                    return s.handleError('CREATE_ACTIVITY_FAIL', err);
                }
                s.log('finished creating activities');
            }
        }

        if (mustRefresh || actionToExecute) {
            s.log(`must reload the page...`);
            window.location.reload();
            await s.sleep(10000);
            s.toggleStatus(false, 'ShowLoader', 'must', 'no');
            return false;
        }


        if (allowDocumentRefresh) {
            s.log(`must refresh UI ...`);
            s.toggleStatus(false, 'ShowLoader', 'must', 'no');
            s.onDocumentChanged(s.id, s.model, s.view_type, true).catch(err => {
                return s.handleError('ON_DOCUMENT_CHANGED_FAILED', err);
            }).finally(data => {
                s.isRefreshing = false;
            });
            return false;
        }

        s.log('Finished createExecutionStep');
        s.toggleStatus(false, 'ShowLoader', 'must', 'no');
        return true;
    }

    async closePreviousActivies(res_model_id, res_id) {
        const s = this;

        var openedActivities = await s.searchLegacy('mail.activity', [], [
            ['res_model_id', '=', parseInt(res_model_id)],
            ['res_id', '=', parseInt(res_id)],
            ['activity_type_id', '=', parseInt(s.process.process_activity_type_id[0])],
        ], 0, 20);

        for (var i = 0; i < openedActivities.length; i++) {
            try {
                s.log(`Activity to unlink: ${openedActivities[i].id}`);

                var query = {
                    model: 'mail.activity',
                    method: 'unlink',
                    args: [
                        parseInt(openedActivities[i].id)
                    ]
                };
                var results = await s.ORM.call(query['model'], query['method'], query['args'], {});
                s.log(`Unlink results: ${results}`)
            }
            catch (err) {
                return s.handleError('UNLINK_ACTIVITY_FAIL', err);
            }
        }
    }

    async createActivity(content, summary, recipient_id, res_model_id, res_id) {
        const s = this;
        s.logf(`createActivity for: ${recipient_id}`)
        // 4 = Todo

        // add a day
        var date = new Date();
        date.setDate(date.getDate() + 0);

        return s.createUpdate('mail.activity', {
            date_deadline: date.toISOString().substring(0, 10),
            res_id: res_id,
            activity_type_id: parseInt(s.process.process_activity_type_id[0]),
            res_model_id: res_model_id,
            create_uid: parseInt(s.user.id),
            user_id: recipient_id,
            note: content,
            summary: summary,
            automated: true
        });
    }

    async createMessage(content, model, res_id, message_type = 'comment') {
        const s = this;
        return s.createUpdate('mail.message', {
            body: content,
            author_id: parseInt(s.user.partner_id[0]),
            model: model,
            res_id: res_id,
            message_type: "notification"
        });
    }

    genClass(prop) {
        const s = this;
        if (Array.isArray(prop)) {
            return prop.map(p => {
                return s.genClass(p);
            }).join(' ');
        }
        return s._config.ui.classes[prop] ? s._config.ui.prefix + s._config.ui.classes[prop] : s.genId(prop);
    }


    btnGen({
        title = false,
        subtitle = false,
        name = 'name',
        color = 'blue',
        icon = false,
        styleBtn = '',
        className = 'processActionBtn'
    }) {
        const s = this;
        var output = [];
        output.push(
            `<button 
                    style="${styleBtn}" 
                    id="${s.genId(name)}" 
                    type="button" 
                    name="${name}" 
                    class="btn oe_stat_button ${s.genClass(className)}">`
        );

        if (icon) {
            output.push(
                `<i 
                    class="fa fa-fw o_button_icon fa-${icon} ${s.genClass(color)}">
                </i>`
            );
        }

        //style="max-width:100%;"
        output.push(
            `<div 
                name="title" 
                class="o_field_widget o_stat_info o_readonly_modifier ${icon ? s.genClass('withIcon') : s.genClass('withoutIcon')}" 
                data-original-title="" 
                title="">`
        );

        if (title) {
            output.push(
                `<span 
                    class="o_stat_text ${s.genClass(color)} ${s.genClass('title')}">
                        ${title}
                </span>`
            );
        }

        if (subtitle) {
            output.push(
                `<span 
                    class="o_stat_text small">
                        ${subtitle}
                </span>`
            );
        }

        output.push(
            `</div>
            </button>`
        );
        return output.join('');
    }



}

//odoo.define('Falinwa.ValidationProcess', ["@web/core/orm_service","@web/session","@web/core/user_service", "@web/core/utils/hooks"], function (require) {
//    "use strict";
//    var lib = {
//        orm: require('@web/core/orm_service'),
////        Core: require('web.core'),
//        session: require('@web/session'),
//        userService: require('@web/core/user_service'),
//        hooks: require('@web/core/utils/hooks')
//    };
////    lib['Qweb'] = lib.Core.qweb;
//
//    $(function () {
//        let instance = new ValidationProcess({
//            version: "17.0.0.0",
//            debug: true,
//            $: $,
//            lib: lib
//        });
//        instance.start();
//        return instance;
//    });
//});
export const validationProcess = {
    dependencies: ["orm"],
    /**
     * @param {import("@web/env").OdooEnv} env
     * @param {Partial<import("services").Services>} services
     */
    start(env, services) {
        var lib = {
        }
        let instance = new ValidationProcess({
           version: "17.0.0.1",
           debug: true,
           $: $,
           lib: lib,
           services: services,
           session: session
         });
         instance.start();
         return instance;
    },
};

registry.category("services").add("validationProcess", validationProcess);
