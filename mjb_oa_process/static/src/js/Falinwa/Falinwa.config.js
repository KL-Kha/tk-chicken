odoo.define('Falinwa.config', function(require) {
    "use strict";
    return {
        validationProcess: {
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
            cacheTimer: 10000,
        }
    };
});
