class validationProcess {

    // class constructor
    constructor(container) {
        const s = this;
        s._ = container;
        s.debug = s._.debug;
        s.config = s._.config[s.constructor.name] || {};
        s.$ = s._.jQuery;
        new s._.lib.helper(s);

        // LOCAL VARIABLES
        s.loop = null;
        s.isDisabled = false;
        s.id = false;
        s.model = false;
        s.hasFormSaveBtn = false;
        s.hasFormEditBtn = false;
        s.isRefreshing = false;
        s.isChecking = false;
        s.keptValidationProcessDataCount = 0;
        s.validationProcessData = null;
    }

    // asynchronous start function
    async asyncStart() {
        const s = this;
        s.logf(`asyncStart`);

        // if the check loop did not start, initialize it
        let check = () => {
            if (s.isChecking)
                return false;
            s.isChecking = true;

            s.checkIfNeedsToExecute()
                .then(r => true)
                .catch(e => {
                    return s.handleError('CHECK_FAIL', e);
                })
                .finally(r => {
                    s.isChecking = false;
                });
        }
        check();

        s.loop = setInterval(
            check,
            s.config.checkTimer);
        return true;
    }

    // check wether or not to execute the main process
    async checkIfNeedsToExecute() {
        const s = this;

        // only performs checks if the module is not disabled
        if (s.isDisabled)
            return false;

        // check if url contains all the parameters required
        var urlParams = s.getAllUrlParam();
        if (!urlParams.hasOwnProperty('view_type') ||
            !urlParams.hasOwnProperty('model') ||
            !urlParams.hasOwnProperty('id') ||
            urlParams['view_type'] !== 'form' ||
            urlParams['model'] === null ||
            urlParams['id'] == null) {
            s.log('This page does not match required url params, skip');
            return false;
        }

        // check if nothing changed
        var hasFormEditBtn =
            (s.$(s.config.tags.formEditBtn).length > 0) &&
            s.$(s.config.tags.formEditBtn).is(':visible');

        var hasFormSaveBtn =
            (s.$(s.config.tags.formSaveBtn).length > 0) &&
            s.$(s.config.tags.formSaveBtn).is(':visible');

        if (!(
                urlParams.model !== s.model ||
                urlParams.id !== s.id ||
                hasFormEditBtn && !s.hasFormEditBtn ||
                hasFormSaveBtn && !s.hasFormSaveBtn
            )) {
            s.log('Nothing changed, skip');
            return false;
        }

        // save state
        s.id = urlParams.id;
        s.model = urlParams.model;
        s.hasFormEditBtn = hasFormEditBtn;
        s.hasFormSaveBtn = hasFormSaveBtn;

        // gather all the processes, 
        //  their related steps,
        //  their related rules,
        //  their related ...
        await s.setValidationProcessData();

        if (s.isRefreshing) {
            s.log(`Already refreshing`);
            return false;
        }

        s.isRefreshing = true;
        return s.refresh()
            .then(d => {})
            .catch(e => {
                return s.handleError('REFRESH_FAIL', e);
            })
            .finally(() => {
                s.isRefreshing = false;
            });
    }

    // error management
    handleError(code, e) {
        const s = this;
        s.disabled = true;
        clearInterval(s.loop);
        s.loop = null;
        console.error(code, e);
        console.log('An error occurred, must refresh to resume.')
        return false;
    }

    // Get relevant process data
    async setValidationProcessData() {
        const s = this;
        //s.logf(`setValidationProcessData`);

        // keep the proces data for some time before requesting it again (cache)
        if (s.validationProcessData !== null &&
            (s.keptValidationProcessDataCount < s.config.clearValidationProcessDataAfter)) {
            s.keptValidationProcessDataCount++;
            return false;
        }

        // get all active processes, avoid too many requests
        var processes = await s.getModel(s.config.processModel, [], [
            [s.config.processFields.active, '=', true]
        ], 0, false);

        // get all related steps, avoid too many requests
        var steps = await s.getModel(s.config.stepModel, [], [
            [s.config.stepFields.active, '=', true],
            [
                s.config.stepFields.process,
                '=',
                processes.reduce((prev, p) => {
                    return prev.concat(p[s.config.processFields.steps])
                }, [])
            ]
        ], 0, false);

        // get all related rules at once, avoid too many requests
        var rules = await s.getModel(s.config.ruleModel, [], [
            [s.config.ruleFields.active, '=', true],
            [
                s.config.ruleFields.step,
                '=',
                steps.reduce((prev, step) => {
                    return prev.concat(step[s.config.stepFields.rules])
                }, [])
            ]
        ], 0, false);

        // attach rules to steps
        steps = steps
            .map(step => {
                step['rules'] =
                    step[s.config.stepFields.rules]
                    .map(ruleId => rules
                        .filter(item => item.id === ruleId)
                    );
                return step;
            });

        // attach steps to processes
        processes = processes
            .map(process => {
                process['steps'] =
                    process[s.config.processFields.steps]
                    .map(stepId => steps
                        .filter(item => item.id === stepId)
                    );
                return process;
            })
            .reduce((prev, process) => { // create usable object rather than array, referenced on model, for ease
                if (!prev[process[s.config.processFields.modelName]]) {
                    prev[process[s.config.processFields.modelName]] = process;
                }
                else {
                   
                } s.handleError(
                        'MULTIPLE_PROCESS_ONE_MODEL',
                        'More than one process on model ' + s.config.processFields.modelName);
                    throw new Error('MULTIPLE_PROCESS_ONE_MODEL');
                    return false;
                return prev;
            }, {});

        console.log(processes);
        throw new Error('STOP');

        s.validationProcessData = processes;
        s.keptValidationProcessDataCount = 0;
        return true;
    }

    // retrieve a collection of models from Odoo
    async getModel(model = false, fields = [], domain = false, offset = 0, limit = 5) {
        return this._.modules.queryEngine.getModel(model, fields, domain, offset, limit);
    }

    // update a model in Odoo
    async updateModel(model = false, item = {}) {
        return this._.modules.queryEngine.updateModel(model, item);
    }

    // get executions for the current object
    async getActiveExecutions(id) {
        const s = this;
        //s.logf(`getActiveExecutions for #${id}`);

        var results = await s.getModel(s.config.executionModel, [], [
            [s.config.executionFields.targetId, '=', id],
            [s.config.executionFields.active, '=', true]
        ], 0, false);

        if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                for (var j = 0; j < s.steps.length; j++) {
                    if (results[i][s.config.executionFields.step][0] === s.steps[j].id) {
                        results[i]['step'] = s.steps[j] || false;
                        results[i]['nextStep'] = s.steps[j + 1] || false;
                        results[i]['prevStep'] = s.steps[j - 1] || false;
                    }
                }
            }
        }
        return results;
    }

    // get steps for the current object
    async getActiveSteps(processId) {
        const s = this;
        //s.logf(`getActiveSteps for process#${processId}`);

        var steps = await s.getModel(s.config.stepModel, [], [
            [s.config.stepFields.process, '=', processId],
            [s.config.stepFields.active, '=', true]
        ], 0, false);

        var userIds = [];

        for (var i = 0; i < steps.length; i++) {

            steps[i]['rules'] = await s.getModel(s.config.ruleModel, [], [
                [s.config.ruleFields.step, '=', steps[i].id],
                [s.config.ruleFields.active, '=', true]
            ], 0, false);

            for (var j = 0; j < steps[i]['rules'].length; j++) {
                steps[i]['rules'][j][s.config.ruleFields.authorizedUsers].map(u => {
                    userIds.push(u);
                })
            }
        }

        var users = await s.getModel('res.users', ['name'], [
            ['id', '=', userIds]
        ], 0, false);

        for (var i = 0; i < steps.length; i++) {
            for (var j = 0; j < steps[i]['rules'].length; j++) {
                steps[i]['rules'][j]['users'] = [];

                steps[i]['rules'][j][s.config.ruleFields.authorizedUsers].map(uid => {
                    users.map(u => {
                        if (u['id'] === uid) {
                            steps[i]['rules'][j]['users'].push(u);
                        }
                    })
                })
            }
        }

        return steps.sort(function(a, b) {
            var keyA = a[s.config.stepFields.sequence],
                keyB = b[s.config.stepFields.sequence];
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
    }

    async refresh() {
        const s = this;
        s.logf(`refresh`);

        return false;
        //reset
        s.process = false;
        s.steps = false;
        s.execution = false;
        s.activeRule = false;

        //get current active process
        s.process = await s.getActiveProcess(s.model);

        //No process, skip
        if (s.process.length === 0) {
            s.disableControls();
            s.destroyUI();
            return false;
        }

        if (s.process.length > 1) {
            s.disableControls();
            return s.handleError('MULTIPLE_PROCESS', 'More than one process active, please only set one per model.')
        }

        s.process = s.process[0];

        //get process steps 
        s.steps = await s.getActiveSteps(s.process.id);

        if (s.steps.length === 0) {
            s.disableControls();
            return s.handleError('NO_STEPS', 'No steps set for this process, please adjust.')
        }

        //active executions
        s.execution = await s.getActiveExecutions(s.id);

        if (s.execution.length > 1) {
            s.disableControls();
            return s.handleError('MULTIPLE_EXECUTION', 'More than one execution active, please only set one per model.')
        }


        if (s.execution.length === 0) {
            s.disableControls();
            s.execution = false;
        }
        else {
            s.execution = s.execution[0];
            if (!s.execution[s.config.executionFields.isFinal])
                s.disableControls();
        }


        //get domain from start condition
        var domain = JSON.parse(s.process[s.config.processFields.startConditionDomain]);
        var triggeredProcessStart = false;
        if (!s.execution) {
            triggeredProcessStart = await s.matchDomain(domain);

            if (triggeredProcessStart) {
                await s.createExecution();
                return s.refresh();
            }
            else {
                s.destroyUI();
                return false;
            }
        }

        console.log(s.execution)

        //conditions to turn on the UI
        var statusBar = s.$(s.config.statusBarTag);
        var doesNotAlreadyHaveUI = !statusBar.hasClass(s.config.uiPrefix + s.config.enabledStatusBarClass);
        s.activeRule = s.getStepValidRule();
        console.log('activeRule', s.activeRule);

        if (doesNotAlreadyHaveUI) {
            s.buildUI();
        }
    }

    async matchDomain(domain = []) {
        const s = this;
        s.logf(`matchDomain: --- ${JSON.stringify(domain)}`);

        //add the current id to the domain
        domain.push(['id', '=', s.id]);

        //results should return the current id
        var results = await s.getModel(s.model, ['id'], domain, 0, 1);

        if (results.length > 0) {
            // console.log(results[0].id.toString());
            //    console.log(s.id.toString());
        }
        return (results.length > 0) && (results[0].id.toString() === s.id.toString());
    }

    async createExecution() {
        const s = this;
        s.logf(`createExecution`);
        var item = {};
        item[s.config.executionFields.name] = `[${s.model}#${s.id}]` + " " + `${ s.process[s.config.processFields.name]}`;
        item[s.config.executionFields.targetId] = s.id;
        item[s.config.executionFields.process] = s.process.id;
        item[s.config.executionFields.step] = s.steps[0].id;
        item[s.config.executionFields.stepSequence] = 0;
        item[s.config.executionFields.active] = true;
        item['id'] = await s.updateModel(s.config.executionModel, item);
        s.execution = item;
        return true;
    }

    async createExecutionStep(action = false) {
        const s = this;
        s.logf(`createExecutionStep`);
        var item = {};
        //s.activeRule.step

        if (action === 'next') {
            s.log('Next action')

            if (s.execution.nextStep) {
                item[s.config.executionFields.step] = s.execution.nextStep.id;
                item[s.config.executionFields.stepSequence] = s.execution.nextStep[s.config.stepFields.sequence];
            }
            else {
                item[s.config.executionFields.isFinal] = true;
            }

            item['id'] = s.execution.id;
            await s.updateModel(s.config.executionModel, item);
        }

        if (action === 'back') {
            if (s.execution.prevStep) {
                item[s.config.executionFields.step] = s.execution.prevStep.id;
                item[s.config.executionFields.stepSequence] = s.execution.prevStep[s.config.stepFields.sequence];
            }
            item['id'] = s.execution.id;
            await s.updateModel(s.config.executionModel, item);
        }

        if (action === 'cancel') {
            item[s.config.executionFields.active] = false;
            item['id'] = s.execution.id;
            await s.updateModel(s.config.executionModel, item);
        }

        return true;
    }

    getStepValidRule() {
        const s = this;
        s.logf(`getStepValidRule`);
        return s.execution['step']['rules'].reduce((p, r) => {
            //if we already found a valid rule, just return it
            if (p)
                return p;

            //find a rule for where user has rights
            if (r.users.length === 0) {
                s.log(`No users set = all users have rights`);
                return r;
            }

            //   console.log(r[s.config.ruleFields.authorizedUsers]);

            if (r[s.config.ruleFields.authorizedUsers].includes(s._.session.uid)) {
                s.log(`Rule user include current user`);
                return r;
            }

            return false;
        }, false);
    }

    disableButtons() {
        const s = this;
        s.logf(`disableButtons`);

    }

    enableButtons() {
        const s = this;
        s.logf(`enableButtons`);

    }

    setEvents() {
        const s = this;
        //s.logf(`setEvents`);
        if (s.ui.btnConfirm)
            s.ui.btnConfirm.click(() => {
                s.handleConfirm().then(data => {}).catch(err => console.log(err));
            });

        if (s.ui.btnBack)
            s.ui.btnBack.click(() => {
                s.handleBack().then(data => {}).catch(err => console.log(err));
            });

        if (s.ui.btnCancel)
            s.ui.btnCancel.click(() => {
                s.handleCancel().then(data => {}).catch(err => console.log(err));
            });

        if (s.ui.btnInfo)
            s.ui.btnInfo.click(() => {
                s.handleInfo().then(data => {}).catch(err => console.log(err));
            });
    }

    disableControls() {
        const s = this;
        var statusBar = s.$(s.config.statusBarTag);
        if (s.execution) {
            if (s.execution[s.config.executionFields.isFinal]) {
                s.logf(`enableControls`);
                statusBar.removeClass("disabledbutton");
                return true;
            }
        }

        s.logf(`disableControls`);
        statusBar.addClass("disabledbutton");
    }

    buildUI() {
        const s = this;
        //s.logf(`buildUI`);
        s.destroyUI();

        var statusBar = s.$(s.config.statusBarTag);
        var btnBar = statusBar.find(s.config.statusBarButtonsTag);
        var btnBox = s.$(s.config.btnBoxTag);

        //Make sur to mark the bar as checked, so we do not do it 2 times
        statusBar.addClass(s.config.uiPrefix + s.config.enabledStatusBarClass);
        s.disableControls();


        btnBox.prepend('<div id="' + s.config.uiPrefix + s.config.customBtnBarTag + '" class="' + s.config.uiPrefix + s.config.customBtnBarTag + '  clearfix"></div>')
        var customBtnBar = btnBox.find('#' + s.config.uiPrefix + s.config.customBtnBarTag);
        customBtnBar.prepend(s.btnGen({
            title: 'Info',
            subtitle: s.process[s.config.processFields.name] || 'this process',
            name: 'info',
            color: 'blue',
            icon: 'info',
            styleBtn: '',
        }));
        if (s.execution[s.config.executionFields.isFinal]) {
            customBtnBar.prepend(s.btnGen({
                title: 'Approved',
                subtitle: false,
                name: 'approved',
                color: 'green',
                icon: 'check-circle',
                styleBtn: '',
            }));
        }
        else {
            if (s.activeRule) {
                customBtnBar.prepend(s.btnGen({
                    title: 'Disapprove',
                    subtitle: "step #" + s.execution[s.config.executionFields.stepSequence],
                    name: 'cancel',
                    color: 'red',
                    icon: 'times',
                    styleBtn: '',
                }));

                if (s.execution.prevStep) {
                    customBtnBar.prepend(s.btnGen({
                        title: 'Back',
                        subtitle: "previous step",
                        name: 'back',
                        color: 'black',
                        icon: 'backward',
                        styleBtn: '',
                    }));
                }


                if (s.execution.nextStep) {
                    customBtnBar.prepend(s.btnGen({
                        title: 'Approve',
                        subtitle: s.execution[s.config.executionFields.step][1] || 'this step',
                        name: 'confirm',
                        color: 'green',
                        icon: 'check',
                        styleBtn: '',
                    }));
                }
                else {
                    customBtnBar.prepend(s.btnGen({
                        title: 'Final approval',
                        subtitle: s.execution[s.config.executionFields.step][1] || 'this step',
                        name: 'confirm',
                        color: 'green',
                        icon: 'check-circle',
                        styleBtn: '',
                    }));
                }
            }
            else {
                customBtnBar.prepend(s.btnGen({
                    title: 'Pending',
                    subtitle: 'for approval',
                    name: 'pending',
                    color: 'orange',
                    icon: 'warning',
                    styleBtn: '',
                }));
            }
        }
        var infobarOutput = s.steps.map(step => {
            var isCurrentStep = s.execution[s.config.executionFields.step][0] === step.id;
            var output = '<div class="clearfix o_not_full oe_button_box" style="background-color: ' +
                (isCurrentStep ? '#d0ebf3;' : '#eee;') +
                '">' +
                '<div id="fal_val_pro_action_buttons clearfix" class="fal_val_pro_action_buttons">';

            output += s.btnGen({
                title: '#' + step[s.config.stepFields.sequence],
                subtitle: false,
                name: step[s.config.stepFields.sequence],
                color: '#333',
                icon: (isCurrentStep ? false : false),
                styleBtn: 'width:60px;padding-left:20px;',
            });

            output += s.btnGen({
                title: step[s.config.stepFields.name] || 'step',
                subtitle: false,
                name: step.id,
                color: '#333',
                icon: false,
                styleBtn: 'width:180px;padding-left:10px;',
            });

            output += step['rules'].map(rule => {
                return s.btnGen({
                    title: rule[s.config.ruleFields.name] || 'rule name',
                    subtitle: rule['users'].map(u => u.name).join(' ,') || 'All users',
                    name: rule.id,
                    color: '#777',
                    icon: false,
                    styleBtn: 'padding-left:10px;width:180px;',
                });
            }).join('');
            output += '</div></div>';
            return output;
        }).join('');

        infobarOutput = '<div style="display:none;" id="' + s.config.uiPrefix + s.config.customInfoBarTag + '" class="clearfix ' + s.config.uiPrefix + s.config.customInfoBarTag + '">' +
            infobarOutput +
            '</div>';
        s.$(infobarOutput).insertBefore(s.$('.oe_title'));

        s.ui = {
            statusBar: statusBar,
            btnBar: btnBar,
            btnBox: btnBox,
            customBtnBar: customBtnBar,
            customInfoBar: s.$('#' + s.config.uiPrefix + s.config.customInfoBarTag),
            btnConfirm: customBtnBar.find('#' + s.config.uiPrefix + 'confirm'),
            btnBack: customBtnBar.find('#' + s.config.uiPrefix + 'back'),
            btnInfo: customBtnBar.find('#' + s.config.uiPrefix + 'info'),
            btnCancel: customBtnBar.find('#' + s.config.uiPrefix + 'cancel')
        }
        s.setEvents();
    }

    destroyUI(enableControls = true) {
        const s = this;
        s.logf(`destroyUI`);
        s.id = false;
        s.model = false;

        if (!s.ui)
            return false;
        s.ui.customBtnBar.remove();
        s.ui.customInfoBar.remove();
        //s.ui.btnBar.show();
        s.ui = null;
        var statusBar = s.$(s.config.statusBarTag);
        if (statusBar.length > 0) {
            statusBar.removeClass(s.config.uiPrefix + s.config.enabledStatusBarClass);
            if (enableControls)
                statusBar.removeClass('disabledbutton');
        }


        // var btnBar = statusBar.find(s.config.statusBarButtonsTag);
        //if (btnBar.length > 0)
        //   btnBar.removeClass("");

    }

    btnGen({
        title = false,
        subtitle = false,
        name = 'name',
        color = 'blue',
        icon = false,
        styleBtn = ''
    }) {
        const s = this;

        var output = '<button ' +
            'style="float: left;border-right-color: #ccc;width: 120px;' + styleBtn + '" ' +
            'id="' +
            s.config.uiPrefix +
            name +
            '" type="button" name="' +
            s.config.uiPrefix +
            name +
            '" class="btn oe_stat_button">';

        if (icon) {
            output += '<i class="fa fa-fw o_button_icon fa-' +
                icon +
                '" style="color:' +
                color +
                ';"></i>'
            output += '<div name="title" class="o_field_widget o_stat_info o_readonly_modifier" data-original-title="" title="">';

        }
        else {
            output += '<div style="max-width:100%;" name="title" class="o_field_widget o_stat_info o_readonly_modifier" data-original-title="" title="">';
        }

        if (title) {
            output += '<span class="o_stat_text" style="color:' +
                color +
                ';">' +
                title +
                '</span>';
        }

        if (subtitle) {
            output += '<span class="o_stat_text small">' +
                subtitle +
                '</span>';
        }

        output += '</div></button>';
        return output;
    }

    async handleConfirm() {
        const s = this;
        s.logf(`handleConfirm`);
        if (s.activeRule) {
            await s.createExecutionStep('next');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleBack() {
        const s = this;
        s.logf(`handleBack`);

        if (s.activeRule) {
            await s.createExecutionStep('back');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleCancel() {
        const s = this;
        s.logf(`handleCancel`);

        if (s.activeRule) {
            await s.createExecutionStep('cancel');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleInfo() {
        const s = this;
        s.logf(`handleInfo`);
        if (s.ui.customInfoBar)
            s.ui.customInfoBar.animate({
                opacity: "toggle",
            }, 300, function() {
                // Animation complete.
            })
    }
}


odoo.define('Falinwa.validationProcess', function(require) {
    "use strict";
    require('web.rpc');
    return validationProcess;
});
