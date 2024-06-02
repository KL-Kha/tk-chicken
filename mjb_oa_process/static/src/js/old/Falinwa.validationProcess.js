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
        // check if there are edit/save buttons
        var urlParams = s.getAllUrlParam();
        var hasFormEditBtn =
            (s.$(s.config.ui.tags.formEditBtn).length > 0) &&
            s.$(s.config.ui.tags.formEditBtn).is(':visible');
        var hasFormSaveBtn =
            (s.$(s.config.ui.tags.formSaveBtn).length > 0) &&
            s.$(s.config.ui.tags.formSaveBtn).is(':visible');

        if (!urlParams.hasOwnProperty('view_type') ||
            !urlParams.hasOwnProperty('model') ||
            !urlParams.hasOwnProperty('id') ||
            urlParams['view_type'] !== 'form' ||
            urlParams['model'] === null ||
            urlParams['id'] == null ||
            (!hasFormEditBtn && !hasFormSaveBtn)
        ) {
            //s.log('This page does not match required url params, skip');
            return false;
        }

        // check if nothing changed
        if (!(
                urlParams.model !== s.model ||
                urlParams.id !== s.id ||
                hasFormEditBtn && !s.hasFormEditBtn ||
                hasFormSaveBtn && !s.hasFormSaveBtn
            )) {
            //s.log('Nothing changed, skip');
            return false;
        }

        // save state
        s.id = urlParams.id;
        s.model = urlParams.model;
        s.hasFormEditBtn = hasFormEditBtn;
        s.hasFormSaveBtn = hasFormSaveBtn;

        // refresh the UI and build the process if needed
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
        s.destroy(code);

        console.error(code, e);
        console.log('An error occurred, must refresh to resume.')

        throw new Error(code, e);
        return false;
    }

    // Get relevant process data
    async setValidationProcessData(model) {
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
            [s.config.processFields.active, '=', true],
            [s.config.processFields.modelName, '=', 'model'],
        ], 0, false);

        if (processes.length == 0) {
            return false;
        }
        var process = processes[0];

        // get all related steps, avoid too many requests
        process['steps'] = await s.getModel(s.config.stepModel, [], [
            [s.config.stepFields.active, '=', true],
            [
                s.config.stepFields.process,
                '=',
                process.id
            ]
        ], 0, false);
        
        /*
        
                processes.reduce((prev, p) => {
                    return prev.concat(p[s.config.processFields.steps])
                }, [])*/

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
        ], 0, false, s.config.ruleFields.sequence + ' asc');

        // get all related users at once, avoid too many requests
        var users = await s.getModel('res.users', [], [
            ['active', '=', true],
            [
                'id',
                '=',
                rules.reduce((prev, rule) => {
                    return prev.concat(rule[s.config.ruleFields.authorizedUsers])
                }, [])
            ]
        ], 0, false);

        // attach users to rules
        rules = rules
            .map(rule => {
                rule['users'] =
                    rule[s.config.ruleFields.authorizedUsers]
                    .map(userId => {
                        let matchedUser = users
                            .filter(item => item.id === userId);
                        return matchedUser[0] ? matchedUser[0] : false;
                    });
                return rule;
            });

        // attach rules to steps
        steps = steps
            .map(step => {
                step['rules'] =
                    step[s.config.stepFields.rules]
                    .map(ruleId => {
                        let matchedRules = rules
                            .filter(item => item.id === ruleId);
                        return matchedRules[0] ? matchedRules[0] : false;
                    });
                return step;
            });

        // attach steps to processes
        processes = processes
            .map(process => {
                process['steps'] =
                    process[s.config.processFields.steps]
                    .map(stepId => {
                        let matchedSteps = steps.filter(item => item.id === stepId);
                        return matchedSteps[0] ? matchedSteps[0] : false;
                    });
                return process;
            })
            .reduce((prev, process) => { // create usable object rather than array, referenced on model, for ease
                if (!prev[process[s.config.processFields.modelName]]) {
                    prev[process[s.config.processFields.modelName]] = process;
                }
                else {
                    s.handleError(
                        'MULTIPLE_PROCESS_ONE_MODEL',
                        'More than one process on model ' + s.config.processFields.modelName);
                    return false;
                }
                return prev;
            }, {});

        s.validationProcessData = processes;
        s.keptValidationProcessDataCount = 0;
        return true;
    }

    // retrieve a collection of models from Odoo
    async getModel(model = false, fields = [], domain = false, offset = 0, limit = 5, order = false) {
        return this._.modules.queryEngine.getModel(model, fields, domain, offset, limit, order);
    }

    // update a model in Odoo
    async updateModel(model = false, item = {}) {
        return this._.modules.queryEngine.updateModel(model, item);
    }

    // get executions for the current object
    async getActiveExecution(objId, processId) {
        const s = this;
        //s.logf(`getActiveExecutions for #${id}`);

        var executions = await s.getModel(s.config.executionModel, [], [
            [s.config.executionFields.process, '=', processId],
            [s.config.executionFields.targetId, '=', objId],
            [s.config.executionFields.active, '=', true]
        ], 0, false);

        if (executions.length === 0) {
            return false;
        }

        if (executions.length > 1) {
            s.handleError(
                'MULTIPLE_EXECUTION_ONE_OBJECT',
                'More than one process on object #' + objId + " for process " + processId + " = " + JSON.stringify(executions));
            return false;
        }

        var execution = executions[0];
        for (var j = 0; j < s.process.steps.length; j++) {
            if (execution[s.config.executionFields.step][0] === s.process.steps[j].id) {
                execution['step'] = s.process.steps[j] || false;
                execution['nextStep'] = s.process.steps[j + 1] || false;
                execution['prevStep'] = s.process.steps[j - 1] || false;
            }
        }
        execution['isFinal'] = execution[s.config.executionFields.isFinal];

        if (!execution['step']) {
            s.handleError(
                'NO_STEP_FOR_ACTIVE_EXECUTION',
                'No step for the execution #' + execution.id + " on obj " + objId + " for process " + processId);
            return false;
        }

        return execution;
    }

    async refresh() {
        const s = this;
        s.logf(`refresh`);

        // gather all the processes, 
        //  their related steps,
        //  their related rules,
        //  their related ...
        await s.setValidationProcessData(s.model);

        // stop if no process for this model
        if (!s.validationProcessData) {
            return s.destroy('No process');
        }

        //set current process var
        s.process = s.validationProcessData;

        // if no steps for this process we consider it as confirmed, not blocking.
        if (s.process.steps.length === 0) {
            s.log('No steps set for this process, please adjust.', 'warn')
            return s.destroy('No step');
        }

        // active executions
        s.execution = await s.getActiveExecution(s.id, s.process.id);

        // if no execution, create one if:
        //  the current object matches the domain of process activation
        if (!s.execution) {
            s.log(`No execution available, check if should create one`);
            let triggeredProcessStart = await s.matchDomain(
                s.id,
                s.model,
                JSON.parse(s.process[s.config.processFields.startConditionDomain]));

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
                return s.destroy('process not started');
            }
        }

        // if we have an execution, show the process UI
        s.log(`There is an active execution`);
        s.build();

        //check for active rules
        var activeRules = await s.checkForActiveRules();

        // No active rule: means we have no conditions on this step's validation
        // which means everyone can confirm it
        if (activeRules.length === 0) {
            s.log(`No active rules: everyone can confirm this step`);
            return s.enableControls();
        }

        // if there are active rules, 
        // we check if current user has the access rights to operate 
        // at least one of them 
        s.log(`There are active rules`);
        s.activeRule = await s.selectFirstRuleWithAccessRights(
            activeRules,
            s._.session.uid
        );

        if (!s.activeRule) {
            s.log(`No active rules where user has access rights, controls remain disabled`);
            s.addStatus('noAccessRights');
            return false;
        }

        if (!s.execution.nextStep)
            s.addStatus('noNextStep');
        if (!s.execution.noPrevStep)
            s.addStatus('noPrevStep');
        if (s.execution.isFinal)
            s.addStatus('isFinal');

        //if we have access rights, enable the controls
        s.enableControls();

        throw new Error('STOP');
        return true;
    }

    addStatus(status) {
        const s = this;
        s.logf(`addStatus: ${status}`);
        s.ui.processActionBar.addClass(`${s.genClass(status)}`);
    }

    disableControls() {
        const s = this;
        s.logf(`disableControls`);
        s.ui.processActionBar.addClass(`${s.genClass('controlDisabled')}`);
        return true;
    }

    enableControls() {
        const s = this;
        s.logf(`enableControls`);
        s.ui.processActionBar.removeClass(`${s.genClass('controlDisabled')}`);
        return true;
    }

    remove() {
        const s = this;
        s.logf(`remove`);
        s.ui.processContainer.remove();
        return true;
    }

    enableBtns() {
        const s = this;
        s.logf(`enableBtns`);
        s.ui.statusBar.removeClass(`${s.genClass('controlDisabled')}`);
        return true;
    }

    build() {
        const s = this;
        s.logf(`build`);

        var ui = {
            statusBar: s.$(s.config.ui.tags.statusBar),
            btnBar: s.$(s.config.ui.tags.statusBar)
                .find(s.config.ui.tags.statusBarButtons),
            btnBox: s.$(s.config.ui.tags.btnBox)
        };

        //check if we already have UI, in which
        if (ui.statusBar.length === 0) {
            return false;
        }

        //Make sur to mark the bar as checked, so we do not do it 2 times
        //ui.statusBar.addClass(s.config.uiPrefix + s.config.enabledStatusBarClass);

        // add all the related process controls in one div inside
        // the a holder in the form
        var processContainer = ui.btnBox;
        processContainer
            .prepend(
                `<div 
                    id="${s.genId('processActionBar')}"
                    class="${s.genClass('processActionBar')} clearfix">
                </div>`);
        ui['processActionBar'] = processContainer.find('#' + s.genId('processActionBar'));

        // buttons to add
        var buttons = [{
            title: 'Info',
            subtitle: s.process[s.config.processFields.name] || 'this process',
            name: 'info',
            color: 'blue',
            icon: 'info',
            styleBtn: '',
            enable: true
        }, {
            title: 'Approved',
            subtitle: false,
            name: 'approved',
            color: 'green',
            icon: 'check-circle',
            styleBtn: ''
        }, {
            title: 'Disapprove',
            subtitle: "step #" + s.execution[s.config.executionFields.stepSequence],
            name: 'cancel',
            color: 'red',
            icon: 'times',
            styleBtn: '',
        }, {
            title: 'Back',
            subtitle: "previous step",
            name: 'back',
            color: 'black',
            icon: 'backward',
            styleBtn: '',
        }, {
            title: 'Approve',
            subtitle: s.execution[s.config.executionFields.step][1] || 'this step',
            name: 'confirm',
            color: 'green',
            icon: 'check',
            styleBtn: '',
        }, {
            title: 'Pending',
            subtitle: 'for approval',
            name: 'pending',
            color: 'orange',
            icon: 'warning',
            styleBtn: '',
        }];

        buttons.map(btn => {
            ui.processActionBar.prepend(s.btnGen(btn));
        });

        ui.processActionBar
            .find(`.${s.genClass('processActionBtn')}`)
            .click((e) => {
                s.handleClick(s.$(e.currentTarget).attr('name'))
                    .then(d => {})
                    .catch(e => { s.handleError('CLICK_FAIL', e) });
            });

        ui.processActionBar.addClass(s.genClass('processActionBarLoaded'));
        ui = s.buildHistoryBar(ui);
        s.ui = ui;
        return true;
    }

    buildHistoryBar(ui) {
        const s = this;
        s.logf(`buildHistoryBar`);
        s.$(`<div 
                id="${s.genId('processHistoryBar')}"
                class="${s.genClass('processHistoryBar')} clearfix">
            </div>`).insertBefore(s.$(s.config.ui.tags.formTitle));

        ui['processHistoryBar'] = s.$('#' + s.genId('processHistoryBar'));
        ui['processHistoryStepBars'] = [];

        s.process.steps.map((step, index) => {
            var barId = 'processHistoryStepBar_' + index;
            var isCurrentStep = (s.execution['step'].id === step.id);
            var additionalClass = `${isCurrentStep? s.genClass('light_blue_bg'): s.genClass('light_grey_bg')}`;

            ui.processHistoryBar
                .append(
                    `<div 
                    id="${s.genId(barId)}"
                    class="o_not_full oe_button_box ${s.genClass('processHistoryStepBar')} ${additionalClass} clearfix">
                </div>`);

            var barObject = ui.processHistoryBar
                .find('#' + s.genId(barId));

            ui['processHistoryStepBars'].push(barObject);

            var buttons = [{
                title: '#' + step[s.config.stepFields.sequence],
                subtitle: false,
                name: `step_${step[s.config.stepFields.sequence]}`,
                color: 'black',
                icon: false,
                styleBtn: 'width:60px;padding-left:20px;',
            }, {
                title: step[s.config.stepFields.name] || 'step',
                subtitle: false,
                name: step.id,
                color: 'black',
                icon: false,
                styleBtn: 'width:180px;padding-left:10px;',
            }];

            if (step.rules.length > 0) {
                step.rules.map(rule => {
                    buttons.push({
                        title: rule[s.config.ruleFields.name] || 'rule name',
                        subtitle: rule['users'].map(u => u.name).join(' ,') || 'All users',
                        name: `rule_${rule.id}`,
                        color: 'black',
                        icon: false,
                        styleBtn: 'padding-left:10px;width:180px;',
                    });
                });
            }

            buttons.map(btn => {
                barObject.append(s.btnGen(btn));
            });
        });
        return ui;
    }

    async handleClick(name) {
        const s = this;
        s.logf(`handleClick`);

        switch (name) {
            case 'info':
                if (s.ui.processHistoryBar)
                    s.ui.processHistoryBar.animate({
                        opacity: "toggle",
                    }, 300, function() {
                        // Animation complete.
                    });
                break;

            case 'confirm':
                if (s.activeRule) {
                    await s.createExecutionStep('next');
                    return s.refresh();
                }
                break;

            case 'cancel':
                if (s.activeRule) {
                    await s.createExecutionStep('cancel');
                    return s.refresh();
                }
                break;

            case 'back':
                if (s.activeRule) {
                    await s.createExecutionStep('back');
                    return s.refresh();
                }
                break;
        }
        return true;
    }

    destroy(reason = '') {
        const s = this;
        s.logf(`destroy: ${reason}`);

        s.enableBtns();
        s.removeControls();
        return true;
    }

    selectFirstRuleWithAccessRights(rules, userId) {
        const s = this;
        s.logf(`selectFirstRuleWithAccessRights`);

        // user is authorized on a rule in 2 cases
        // - if there is no user set on the rule = everyone is allowed
        // - if there are users set on rule, it must be one of them

        return rules.reduce((prev, rule) => {
            if (!prev) {
                if (rule[s.config.ruleFields.authorizedUsers].length === 0 ||
                    rule[s.config.ruleFields.authorizedUsers].includes(userId)) {
                    return rule;
                }
            }
            return prev;
        }, false)
    }

    async checkForActiveRules() {
        const s = this;
        s.logf(`checkForActiveRules`);
        var rules = [];
        for (var i = 0; i < s.execution.step.rules.length; i++) {
            let rule = s.execution.step.rules[i];
            let matched = await s.matchDomain(
                s.id,
                s.model,
                JSON.parse(rule[s.config.ruleFields.applyOnDomain])
            );
            if (matched) {
                rules.push(rule);
            }
        }
        return rules;
    }

    async matchDomain(id, model, domain = []) {
        const s = this;
        s.logf(`matchDomain: ${JSON.stringify(domain)}`);

        //add the current id to the domain
        domain.push(['id', '=', id]);

        //results should return the current id
        var matches = await s.getModel(model, ['id'], domain, 0, 1);

        return (matches.length > 0) &&
            (matches[0].id.toString() === id.toString());
    }

    async createExecution(id, processId, stepId) {
        const s = this;
        s.logf(`createExecution`);
        var item = {};
        item[s.config.executionFields.name] = `[object #${id}]` + " Start process #" + processId + " at " + s.now_toLocaleString();
        item[s.config.executionFields.targetId] = id;
        item[s.config.executionFields.process] = processId;
        item[s.config.executionFields.step] = stepId;
        item[s.config.executionFields.stepSequence] = 0;
        item[s.config.executionFields.active] = true;
        item[s.config.executionFields.isFinal] = false;
        item['id'] = await s.updateModel(s.config.executionModel, item);
        return item;
    }

    async createExecutionStep(action = false) {
        const s = this;
        s.logf(`createExecutionStep`);
        var item = {};

        if (action === 'confirm') {
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

    genClass(prop) {
        const s = this;
        return s.config.ui.classes[prop] ? s.config.ui.prefix + s.config.ui.classes[prop] : s.genId(prop);
    }

    genId(name) {
        const s = this;
        return s.config.ui.prefix + name;
    }

    btnGen({
        title = false,
        subtitle = false,
        name = 'name',
        color = 'blue',
        icon = false,
        styleBtn = '',
        enable = false
    }) {
        const s = this;
        var output = [];
        output.push(
            `<button 
                    style="${styleBtn}" 
                    id="${s.genId(name)}" 
                    type="button" 
                    name="${name}" 
                    class="btn oe_stat_button ${enable?'':s.genClass('controlDisabled')} ${s.genClass('processActionBtn')}">`
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
                class="o_field_widget o_stat_info o_readonly_modifier ${icon?s.genClass('withIcon'):''}" 
                data-original-title="" 
                title="">`
        );

        if (title) {
            output.push(
                `<span 
                    class="o_stat_text ${s.genClass(color)}">
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

odoo.define('Falinwa.validationProcess', function(require) {
    "use strict";
    return validationProcess;
});
