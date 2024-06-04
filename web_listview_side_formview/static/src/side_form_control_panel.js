/** @odoo-module **/

import {ControlPanel} from '@web/search/control_panel/control_panel';
import {useSubEnv} from "@odoo/owl";

export class SideFormControlPanel extends ControlPanel {

    setup() {
        useSubEnv({
            config: {
                ...this.env.config,
                pagerProps: undefined,
                viewSwitcherEntries: undefined,
            },
        });
        super.setup();
    }

}

SideFormControlPanel.template = 'web_listview_side_formview.SideFormControlPanel';
