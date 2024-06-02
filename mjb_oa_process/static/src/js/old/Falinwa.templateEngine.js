class templateEngine {

    constructor(container) {
        const s = this;
        s._ = container;
        s.debug = s._.debug;
        s.$ = s._.jQuery;
        new s._.lib.helper(s);

        // Local vars
        s.config = {
            path: 'mjb_oa_process/static/src/html',
            templates: [
                'btn'
            ],
        }
    }

    start() {
        const s = this;
        //s.logf(`start`);
        var urlInfo = s.getUrl();
        s.templatePath = urlInfo.url + '/' + s.config.path;
        console.log(HandleBars)
        s.asyncStart().then(() => {}).catch(err => console.log(err));
    }

    async asyncStart() {
        const s = this;
        //s.logf(`asyncStart`);
        return true;
    }
}


odoo.define('Falinwa.templateEngine', function(require) {
    "use strict";
    return templateEngine;
});
