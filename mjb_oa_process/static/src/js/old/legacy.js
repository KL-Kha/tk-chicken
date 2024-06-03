/*
        customBtnBar.prepend(s.btnGen('cancel', 'secondary', 'Cancel', "color:red!important;"));
        customBtnBar.prepend(s.btnGen('back', 'secondary', 'Back'));
        customBtnBar.prepend(s.btnGen('confirm', 'primary', 'Confirm'));
*/

        /*
                 return '<button ' +
                    (style ? 'style="' + style + '" ' : '') +
                    'id="' +
                    s.config.uiPrefix +
                    name +
                    '" type="button" name="' +
                    s.config.uiPrefix +
                    name +
                    '" class="btn btn-' +
                    className +
                    ' ' +
                    s.config.uiPrefix +
                    s.config.actionBtnClass +
                    '"><span>' +
                    desc +
                    '</span></button>';*/
                    
                    
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
                '<div id="fal_val_pro_action_buttons" class="fal_val_pro_action_buttons">';

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
            '</div><div class="clearfix"></div>';
        s.$(infobarOutput).insertBefore(s.$('.oe_title'));
        
        
        
        
        -----
        
        
        


    // TODO

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

    async handleConfirm() {
        const s = this;
        s.logf(`
            handleConfirm `);
        if (s.activeRule) {
            await s.createExecutionStep('next');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleBack() {
        const s = this;
        s.logf(`
            handleBack `);

        if (s.activeRule) {
            await s.createExecutionStep('back');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleCancel() {
        const s = this;
        s.logf(`
            handleCancel `);

        if (s.activeRule) {
            await s.createExecutionStep('cancel');
            s.destroyUI(false);
            return s.refresh();
        }
    }

    async handleInfo() {
        const s = this;
        s.logf(`
            handleInfo `);
        if (s.ui.customInfoBar)
            s.ui.customInfoBar.animate({
                opacity: "toggle",
            }, 300, function() {
                // Animation complete.
            })
    }
    
    
    
    

    buildUI() {
        const s = this;
        //s.logf(`buildUI`);
        s.destroyUI();


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