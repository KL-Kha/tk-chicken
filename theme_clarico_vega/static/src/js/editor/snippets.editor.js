/** @odoo-modules **/

import { _lt, _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import SnippetsMenu from "@website/js/editor/snippets.editor";

SnippetsMenu.SnippetsMenu.include({
    events: Object.assign({}, SnippetsMenu.SnippetsMenu.prototype.events, {
        'click .o_we_customize_theme_btn_ept': '_onThemeTabClickEpt',
    }),
    tabs: Object.assign({}, SnippetsMenu.SnippetsMenu.prototype.tabs, {
        THEME_EPT: 'theme-ept',
    }),
    OptionsTabStructureEpt: [
        ['general-settings-ept', _lt("General Settings")],
        ['shop-page-ept', _lt("Shop Page")],
        ['product-page-ept', _lt("Product Page")],
        ['cart-page-ept', _lt("cart Page")],
    ],
    async _onThemeTabClickEpt(ev) {
        console.log('_onThemeTabClickEpt');
        let releaseLoader;
        try {
            const promise = new Promise(resolve => releaseLoader = resolve);
            this._execWithLoadingEffect(() => promise, false, 400);
            // loader is added to the DOM synchronously
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            // ensure loader is rendered: first call asks for the (already done) DOM update,
            // second call happens only after rendering the first "updates"

            if (!this.topFakeOptionElEpt) {
                let el;
                for (const [elementName, title] of this.OptionsTabStructureEpt) {
                    const newEl = document.createElement(elementName);
                    newEl.dataset.name = title;
                    if (el) {
                        el.appendChild(newEl);
                    } else {
                        this.topFakeOptionElEpt = newEl;
                    }
                    el = newEl;
                }
                this.bottomFakeOptionElEpt = el;
                this.el.appendChild(this.topFakeOptionElEpt);
            }

            // Need all of this in that order so that:
            // - the element is visible and can be enabled and the onFocus method is
            //   called each time.
            // - the element is hidden afterwards so it does not take space in the
            //   DOM, same as the overlay which may make a scrollbar appear.
            this.topFakeOptionElEpt.classList.remove('d-none');
            const editorPromise = this._activateSnippet($(this.bottomFakeOptionElEpt));
            releaseLoader(); // because _activateSnippet uses the same mutex as the loader
            releaseLoader = undefined;
            const editor = await editorPromise;
            this.topFakeOptionElEpt.classList.add('d-none');
            editor.toggleOverlay(false);

            this._updateRightPanelContent({
                tab: this.tabs.THEME_EPT,
            });
        } catch (e) {
            // Normally the loading effect is removed in case of error during the action but here
            // the actual activity is happening outside of the action, the effect must therefore
            // be cleared in case of error as well
            if (releaseLoader) {
                releaseLoader();
            }
            throw e;
        }
    },
});

export default {
    SnippetsMenu: SnippetsMenu.SnippetsMenu,
};
