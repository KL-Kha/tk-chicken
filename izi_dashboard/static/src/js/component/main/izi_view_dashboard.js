/** @odoo-module */

import Widget from "@web/legacy/js/core/widget";
import { jsonrpc } from "@web/core/network/rpc_service";
import { _t } from "@web/core/l10n/translation";
import IZIViewDashboardBlock from "@izi_dashboard/js/component/main/izi_view_dashboard_block";
var IZIViewDashboard = Widget.extend({
    template: 'IZIViewDashboard',
    events: {
        'click input': '_onClickInput',
        'click button': '_onClickButton',
        'click .izi_view_dashboard_ask_bg': '_onClickBgDashboardAsk',
        'click .izi_view_dashboard_ask_btn': '_onClickSubmitAsk',
        'keydown .izi_view_dashboard_ask_input': '_onKeydownInputAsk',
        'click .code_execution': '_onClickExecuteCode',
    },

    /**
     * @override
     */
    init: function (parent) {
        this._super.apply(this, arguments);

        this.parent = parent;
        this.$grid;
        this.$editor;
        this.$editorContainer;
        this.selectedDashboard;
        this.$blocks = [];
        this.ai_messages = [{
            'role': 'assistant',
            'content': `Hello! I am your Personal Data Consultant. Feel free to ask me anything related to data analysis, from monitoring business indicators to writing Python code for executing data science models. How can I assist you today?`,
        }];
    },

    willStart: function () {
        var self = this;

        return this._super.apply(this, arguments).then(function () {
            return self.load();
        });
    },

    load: function () {
        var self = this;
    },

    start: function () {
        var self = this;
        this._super.apply(this, arguments);

        // Dashboard Ask
        self.$viewDashboardAsk = self.$('.izi_view_dashboard_ask');
    },

    _onClickExecuteCode: function(ev) {
        var self = this;
        ev.stopPropagation();
        if ($(ev.currentTarget) && $(ev.currentTarget).closest('.code_content_sql')) {
            var query = $(ev.currentTarget).closest('.code_content_sql').text();
            query = query.replaceAll('play_arrow', '');
            if (query && self.selectedDashboard) {
                jsonrpc('/web/dataset/call_kw/izi.dashboard/action_execute_code', {
                    model: 'izi.dashboard',
                    method: 'action_execute_code',
                    args: [self.selectedDashboard, query],
                    kwargs: {},
                }).then(function (result) {
                    if (result.status == 200) {
                        if (result.id) {
                            self._getOwl().action.doAction({
                                type: 'ir.actions.act_window',
                                name: _t('Analysis'),
                                target: 'new',
                                res_id: result.id,
                                res_model: 'izi.analysis',
                                views: [[false, 'izianalysis']],
                                context: {'analysis_id': result.id},
                            },{
                                onClose: function(){
                                    // self.$visual._renderVisual(self.args);
                                }
                            });
                        }
                    } else {
                        if (result.status == 401) {
                            new swal('Need Access', result.message, 'warning');
                            self._getOwl().action.doAction({
                                type: 'ir.actions.act_window',
                                name: _t('Need API Access'),
                                target: 'new',
                                res_model: 'izi.lab.api.key.wizard',
                                views: [[false, 'form']],
                                context: {},
                            },{
                                onClose: function(){
                                }
                            });
                        } else
                            new swal('Error', result.message, 'error');
                    }
                });
            }
        }
    },

    _renderAIMessages: function() {
        var self = this;
        self.$viewDashboardAsk.empty();
        var lastRole = false;
        self.ai_messages.forEach(msg => {
            var role = msg.role;
            var role_name = (role == 'assistant') ? 'Consultant' : 'You';
            var style = (role == 'assistant') ? `background: url('/izi_dashboard/static/description/icon_avatar.png');background-size: contain;` : 'background: #875A7B';
            var initial = (role == 'assistant') ? '' : 'U';
            var message_content = msg.content;
            if (lastRole != role) {
                self.$viewDashboardAsk.append(`
                    <div class="role_section">
                        <div class="role_avatar" style="${style}">${initial}</div>
                        <div class="role_name">${role_name}</div>
                    </div>
                `)
                lastRole = role;
            }
            self.$viewDashboardAsk.append(`
                    <div class="message_section">
                        <div class="message_content" style="white-space:pre-wrap;">${message_content}</div>
                    </div>
            `)
        });
        self.$viewDashboardAsk.animate({
            scrollTop: self.$viewDashboardAsk.get(0).scrollHeight
        }, 1000);
    },

    _onClickSubmitAsk: function(ev) {
        var self = this;
        var message_content = self.$('.izi_view_dashboard_ask_input').val();
        self.ai_messages.push({
            'role': 'user',
            'content': message_content,
        })
        self._renderAIMessages();
        self.$('.izi_view_dashboard_ask_input').val('');

        // Submit To AI
        if (self.selectedDashboard && self.ai_messages) {
            let spinner = $(`<span class="spinner-border spinner-border-small" style="margin-top: 20px;"/>`);
            spinner.appendTo(self.$viewDashboardAsk);
            jsonrpc('/web/dataset/call_kw/izi.dashboard/action_get_lab_script', {
                model: 'izi.dashboard',
                method: 'action_get_lab_ask',
                args: [self.selectedDashboard, self.ai_messages],
                kwargs: {},
            }).then(function (result) {
                self.$viewDashboardAsk.find('.spinner-border').remove();
                if (result.status == 200) {
                    if (result.new_message_content) {
                        self.ai_messages.push({
                            'role': 'assistant',
                            'content': result.new_message_content,
                        })
                        self._renderAIMessages();
                    }
                } else {
                    if (result.status == 401) {
                        new swal('Need Access', result.message, 'warning');
                        self._getOwl().action.doAction({
                            type: 'ir.actions.act_window',
                            name: _t('Need API Access'),
                            target: 'new',
                            res_model: 'izi.lab.api.key.wizard',
                            views: [[false, 'form']],
                            context: {},
                        },{
                            onClose: function(){
                            }
                        });
                    } else
                        new swal('Error', result.message, 'error');
                }
            }); 
        }
    },

    _onKeydownInputAsk: function(ev) {
        var self = this;
        if (self.$('.izi_view_dashboard_ask_input').is(':focus') && (ev.keyCode == 13) && (!ev.shiftKey)) {
            ev.preventDefault();
            self._onClickSubmitAsk();
        }
    },

    _onClickBgDashboardAsk: function(ev) {
        var self = this;
        self.$viewDashboardAsk.closest('.izi_dialog').hide();
    },

    _getViewVisualByAnalysisId: function(analysis_id) {
        var self = this;
        var view_visual = false;
        self.$blocks.forEach(function (block) {
            if (block.analysis_id == analysis_id) {
                view_visual = block.$visual;
            }
        });
        return view_visual;
    },

    /**
     * Private Method
     */
    _setDashboard: function(dashboard_id) {
        var self = this;
        self.selectedDashboard = dashboard_id;
    },
    _loadDashboard: function (filters, mode=false) {
        var self = this;
        self._clear();
        if (self.selectedDashboard) {
            jsonrpc('/web/dataset/call_kw/izi.dashboard.block/search_read', {
                model: 'izi.dashboard.block',
                method: 'search_read',
                args: [[['dashboard_id', '=', self.selectedDashboard]], ['id', 'gs_x', 'gs_y', 'gs_w', 'gs_h', 'min_gs_w', 'min_gs_h', 'analysis_id', 'animation', 'refresh_interval', 'visual_type_name', 'rtl']],
                kwargs: {},
            }).then(function (res) {
                // console.log('Load Dashboard', res);
                self.dashboardBlocks = res;
                // Init Grid
                if (!self.$grid) {
                    self.$grid = GridStack.init();
                    self.$grid.margin(7);
                    self.$grid.float('true');
                    self.$grid.cellHeight(125);
                }
                self.$grid.enableMove(false);
                self.$grid.enableResize(false);
                self.$grid.removeAll();
                // For Each Dashboard Block
                var nextY = 0;
                var index = 0;
                self.dashboardBlocks.forEach(block => {
                    var isScoreCard = false;
                    if (block.visual_type_name && block.visual_type_name.toLowerCase().indexOf("scrcard") >= 0)
                        isScoreCard = true;
                    if (mode == 'ai_analysis') {
                        if (isScoreCard) {
                            block.gs_x = 0;
                            block.gs_h = 3;
                            block.gs_w = 12;
                        } else {
                            block.gs_x = 0;
                            block.gs_h = 4;
                            block.gs_w = 12;
                        }
                    }
                    var widgetValues = {
                        'id': block.id,
                        'w': block.gs_w,
                        'h': block.gs_h,
                        'x': block.gs_x,
                        'y': block.gs_y,
                        'minW': block.min_gs_w,
                        'minH': block.min_gs_h,
                        // 'autoPosition': 'true',
                    }
                    if (window.innerWidth <= 792 || mode == 'ai_analysis') {
                        widgetValues.y = nextY;
                        nextY += widgetValues.h;
                    }
                    self.$grid.addWidget(widgetValues);
                    // Init IZIViewDashboardBlock
                    if (block.analysis_id) {
                        var args = {
                            'id': block.id,
                            'analysis_id': block.analysis_id[0],
                            'analysis_name': block.analysis_id[1],
                            'animation': block.animation,
                            'filters': filters,
                            'refresh_interval': block.refresh_interval,
                            'index': index,
                            'mode': mode,
                            'visual_type_name': block.visual_type_name,
                            'rtl': block.rtl,
                        }
                        index += 1;
                        var $block = new IZIViewDashboardBlock(self, args);
                        $block.appendTo($(`.grid-stack-item[gs-id="${block.id}"] .grid-stack-item-content`));
                        self.$blocks.push($block);
                    }
                });
            });
        }
    },

    _clear() {
        var self = this;
        self.$blocks.forEach($block => {
            $block.clearInterval();
            $block.destroy();
        })
        self.$blocks = [];
    },

    _removeItem(id) {
        this.$grid.engine.nodes = (this.$grid.engine.nodes).filter(object => {
            return object.id !== id;
            });
        $(`.grid-stack-item[gs-id="${id}"]`).remove();
    },

    _onClickInput: function(ev) {
        var self = this;
    },

    _onClickButton: function (ev) {
        var self = this;
    },
    
    _getOwl: function() {
        var cur_obj = this;
        while (cur_obj) {
            if (cur_obj.__owl__) {
                return cur_obj;
            }
            cur_obj = cur_obj.parent;
        }
        return undefined;
    },
});

export default IZIViewDashboard;