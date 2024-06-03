class Helper {
    constructor(instance) {
        const s = instance;
        const prefix = `${s.constructor.name.substring(0,3).toUpperCase()} ` + " | ";
        const functionPrefix = "[F] ";
        const indentChar = " ";
        var logIndentLevel = 0;

        const displayHelp = false;

        s['logHelperFeature'] = function(msg) {
            if (s.constructor.name === 'Falinwa') {
                if (s.debug && displayHelp)
                    console.log(msg);
            }
        }

        s.logHelperFeature("now: return current date");
        s['now'] = function() {
            return new Date();
        }

        s.logHelperFeature("now_toLocaleTimeString: return current date formated to local time");
        s['now_toLocaleTimeString'] = function() {
            return s.now().toLocaleTimeString();
        }
        s.logHelperFeature("now_toLocaleString: return current date formated to local time");
        s['now_toLocaleString'] = function() {
            return s.now().toLocaleString();
        }

        s.logHelperFeature("log(msg, type='log'): display log message if debug is true");
        s['log'] = function(msg, type = 'log', indent = false) {
            indent = indent ? indentChar.repeat(logIndentLevel) : indentChar;

            if (s.debug)
                console[type](s.now_toLocaleTimeString() + " | " + `${prefix}` + indent + `${msg.toString()}`);
        }

        s.logHelperFeature("logf(msg): display function title log message if debug is true");
        s['logf'] = function(msg, end = false) {
            if (!end) {
                logIndentLevel++;
            }
            else {
                logIndentLevel--;
            }
            s.log(functionPrefix + `${msg.toString()}`);
        }

        s.logHelperFeature("getUrl: returns url, domain, domainRoot, protocol of the current page");
        s['getUrl'] = function() {
            var protocol = 'http://';
            if (window.location.href.indexOf("https") > -1) {
                protocol = 'https://';
            }


            var domainRoot = document.domain;
            var domainParts = document.domain.split('.');
            if (domainParts.length >= 2) {
                domainRoot = domainParts[domainParts.length - 2] + '.' + domainParts[domainParts.length - 1];
            }

            return {
                url: `${protocol}${document.domain}`,
                domain: document.domain,
                domainRoot: domainRoot,
                protocol: protocol
            }
        }


        s.logHelperFeature("getUrlParam(param): return the param from url");
        s['getUrlParam'] = function(p) {
            var params = s.getAllUrlParam();
            // console.log(params)
            return params.hasOwnProperty(p) ? params[p] : null;
        }

        s.logHelperFeature("getAllUrlParam(): return all params from url");
        s['getAllUrlParam'] = function(url = window.location.href) {
            if (url.includes('?')) {
                url = url.split('?')[1];
            }

            if (url.includes('#')) {
                url = url.split('#')[1];
            }

            return url.split('&').reduce((p, v) => {
                if (v.includes('#'))
                    v = v.split('#')[1];
                v = v.split('=');
                if (v.length === 2)
                    p[v[0]] = v[1];
                return p;
            }, {});
        }

        s.logHelperFeature("async sleep(timer): sleeps for timer ms");
        s['sleep'] = async function(timer) {
            s.logf(`sleep: ${timer}`);
            return new Promise(res => {
                setTimeout(function() {
                    res(true);
                }, timer)
            })
        }
    }
}

odoo.define('Falinwa.helper', function(require) {
    "use strict";
    return Helper;
});
