/** @odoo-module **/
const {useState, useChildSubEnv, useExternalListener} = owl;

import {ListRenderer} from '@web/views/list/list_renderer';


import {patch} from '@web/core/utils/patch';
import {useService} from '@web/core/utils/hooks';
import {SideFormviewContainer} from './side_form_view_container';
import {sideFormBeforeChangeFunctions} from "./hooks";

patch(ListRenderer.prototype, {

    setup() {
        super.setup(...arguments);
        this.actionService = useService('action');
        this.viewService = useService('view');
        this.userService = useService('user');

        this.sideFormView = useState({
            show: false,
            id: 0,
        })

        const formViewId = this.getFormViewId()
        useChildSubEnv({
            config: {
                ...this.env.config,
                isX2Many: this.isX2Many,
                views: [[formViewId, 'form']],
                close: this.closeSideFormview.bind(this),
            },
        });

        useExternalListener(window, 'keyup', this._onKeyUp.bind(this));
    },

    _onKeyUp(ev) {
        if (this.sideFormView.show && ev.code === 'Escape') {
            this.closeSideFormview();
        }
    },

    getFormViewId() {
        return this.env.config.views.find(view => view[1] === 'form')?.[0] || false
    },

    getSideFormViewContainerProps() {
        const props = {
            resModel: this.props.list.resModel,
            resId: this.sideFormView.id,
            context: {
                ...this.sideFormViewRecord.context,
            },
            record: this.sideFormViewRecord,
        }
        const viewId = this.getFormViewId()
        if (viewId) {
            props.viewId = viewId
        }
        return props
    },

    async callSideFormBeforeChangeFunctions() {
        return await Promise.all(sideFormBeforeChangeFunctions.map(func => func()))
    },

    async onCellClicked(record, column, ev) {
        if (
            (!this.isX2Many && !this.env.splitView?.enabled)
            || (this.isX2Many && !this.props.archInfo.splitView)
        ) {
            super.onCellClicked(...arguments);
            return;
        }
        if (ev.target.special_click) {
            return;
        }
        if (record.resId && this.sideFormView.id !== record.resId) {
            await this.callSideFormBeforeChangeFunctions();
            this.sideFormView.id = record.resId;
            this.sideFormView.show = true;
            this.sideFormViewRecord = record;
            this.recordDatapointID = record.id;
        }
    },

    async closeSideFormview() {
        await this.callSideFormBeforeChangeFunctions();
        this.sideFormView.show = false;
        this.sideFormView.id = false;
        // this.keepFocusRow()
    },

    keepFocusRow() {
        this.tableRef.el.querySelector('tbody').classList.add('o_keyboard_navigation');
        const focusRow = this.tableRef.el.querySelector(`[data-id='${this.recordDatapointID}']`);
        focusRow.focus();
    }

})

ListRenderer.components = {
    ...ListRenderer.components,
    SideFormviewContainer,
};

