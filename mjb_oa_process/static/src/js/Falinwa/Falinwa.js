class Falinwa {
    constructor({
        features = ['queryEngine', 'validationProcess'],
        debug = (document.location.href.indexOf('debug') !== -1),
        jQuery = false,
        lib = false,
        session = false,
        config = {}
    }) {
        const s = this;
        s.lib = lib || {};
        s.jQuery = jQuery || false;
        s.debug = debug || false;
        s.features = features;
        s.session = session;
        s.config = config;

        // Check for libs
        if (!s.lib || !s.jQuery) {
            console.warn('Falinwa.js: Cannot start, missing lib or jQuery init.');
            return false;
        }

        // Check if we have all deps for the features we activate
        if (!s.features.reduce((p, f) => {
                if (!s.lib.hasOwnProperty(f))
                    console.warn(`Falinwa.js: missing lib ${f}`);
                return p && s.lib.hasOwnProperty(f);
            }, true)) {
            console.warn('Falinwa.js: Cannot start, missing lib for features.');
            return false;
        }

        new s.lib.helper(s);
        s.modules = {};
    }

    start() {
        const s = this;
        s.logf(`start`);

        // init features
        s.features.map(f => {
            s.log(`add feature: ${f}`);
            s.modules[f] = new(s.lib[f])(s);
        });

        // try to start it if we have such a method implented
        s.features.map(f => {
                if (s.modules[f]['asyncStart']) {
                    s.log(`asyncStart feature: ${f}`);
                    s.modules[f].asyncStart()
                        .then(() => {})
                        .catch(console.error);
                        }
                    else {
                        if (s.modules[f]['start']) {
                            s.log(`start feature: ${f}`);
                            s.modules[f].start();
                        }
                    }
                });
        }
    }

    odoo.define('Falinwa', function(require) {
        "use strict";
        $(function() {
            var session = require('web.session');
            var instance = new Falinwa({
                jQuery: $,
                config: require('Falinwa.config'),
                lib: {
                    'rpc': require('web.rpc'),
                    'helper': require('Falinwa.helper'),
                    'queryEngine': require('Falinwa.queryEngine'),
                    'validationProcess': require('Falinwa.validationProcess')
                },
                session: session
            });
            instance.start();
            return instance;
        });
    });
