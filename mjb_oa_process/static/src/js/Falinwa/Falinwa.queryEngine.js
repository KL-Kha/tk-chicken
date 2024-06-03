class queryEngine {

    constructor(container) {
        const s = this;
        s._ = container;
        s.debug = s._.debug;
        s.$ = s._.jQuery;
        new s._.lib.helper(s);

        s._cache = {};
        s._cacheLoop = false;
        s._timerCache = 5000;
    }

    start() {
        const s = this;
        //s.logf(`start`);
    }

    setCache(key, value) {
        const s = this;
        //s.logf(`setCache`);
        s._cache[key] = value;
    }

    getCache(key) {
        const s = this;
        //s.logf(`getCache`);
        if (s._cache.hasOwnProperty(key))
            return s._cache[key];
        return null;
    }

    cleanCache() {
        const s = this;
        //s.logf(`cleanCache`);
        s._cache = {};
    }

    async updateModel(model, item) {
        const s = this;
       // s.logf(`updateModel: ${model}`);
        
        var method = 'create';
        var args = [
            item
        ];

        if (item.hasOwnProperty('id')) {
            method = 'write';
            args = [
                item.id,
                item
            ];
        }

        var output = false;
        try {
            output = await s._.lib.rpc.query({
                model: model,
                method: method,
                args: args,
            })
        }
        catch (err) {
            s.log(err)
        }

        // s.setCache(cacheKey, output);
        return output;
    }

    async getModel(model = false, fields = [], domain = false, offset = 0, limit = 5, order = false) {
        const s = this;
       // s.logf(`getModel: ${model} -- ${JSON.stringify(domain)} -- ${order}`);
        /* var cacheKey = JSON.stringify({
             model: model,
             fields: fields,
             domain: domain,
             offset: offset,
             limit: limit
         });

         var cacheValue = s.getCache(cacheKey);

         if (cacheValue !== null) {
             return cacheValue;
         }*/

        if (!model || !domain)
            return [];

        var args = [
            domain,
            fields,
            offset,
            limit,
            order
        ];

        var output = [];
        try {
            output = await s._.lib.rpc.query({
                model: model,
                method: 'search_read',
                args: args,
            })
        }
        catch (err) {
            s.log(err)
        }

        // s.setCache(cacheKey, output);
        return output;
    }
}


odoo.define('Falinwa.queryEngine', function(require) {
    "use strict";
    require('web.rpc');
    return queryEngine;
});
