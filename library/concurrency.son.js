(function () {
    'use strict';
    var list = require('texo');
    var range = list.range;
    var eq = list.eq;
    function tryCatch(tryBody, catchBody) {
        try {
            return tryBody();
        } catch (e) {
            return catchBody(e);
        }
    }
    function mix(parent, child) {
        var key;
        var obj = {};
        for (key in parent) {
            obj[key] = parent[key];
        }
        for (key in child) {
            obj[key] = child[key];
        }
        return obj;
    }
    function addKey(parent, newKey, newValue) {
        var obj = {}, key;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function contains(collection, value) {
        var i, key;
        if (typeof collection === 'function' && collection.count) {
            for (i = 0; i < collection.count; i++) {
                if (list.eq(collection(i), value)) {
                    return true;
                }
            }
        } else {
            for (key in collection) {
                if (list.eq(collection[key], value)) {
                    return true;
                }
            }
        }
        return false;
    }
    function applied(value, rest) {
        return rest(value);
    }
    function predicate(value, next) {
        return value ? next(value) : false;
    }
    function findWhere(value, rest) {
        var res, count;
        if (!value)
            return false;
        if ($sonata_ofType(value, List)) {
            count = value.count;
            for (var i = 0; i < count; i++) {
                if (res = rest(value(i))) {
                    return res;
                }
            }
            return false;
        }
        return rest(value);
    }
    function findAllWhere(value, rest) {
        var all, res, count;
        if (!value)
            return list();
        if ($sonata_ofType(value, List)) {
            count = value.count;
            all = list();
            for (var i = 0; i < count; i++) {
                if (res = rest(value(i))) {
                    all = all.concat(res);
                }
            }
            return all;
        }
        return list(rest(value));
    }
    function ensure(predicateResult, msg) {
        if (!predicateResult) {
            throw Error(msg || 'ensure failed');
        }
        return true;
    }
    function forIn(collection, func) {
        var i, t = typeof collection, resultArray = [];
        switch (t) {
        case 'string':
            for (i = 0; i < collection.length; i++) {
                resultArray.push(func(collection.charAt(i), i));
            }
            return resultArray;
        case 'object':
            if (typeof collection.map === 'function') {
                return collection.map(func);
            } else {
                var keys = Object.keys(collection);
                for (i = 0; i < keys.length; i++) {
                    resultArray.push(func(keys[i], collection[keys[i]]));
                }
                return resultArray;
            }
        case 'function':
            return collection.map(func);
        }
    }
    function $sonata_ofType(x, type) {
        switch (typeof x) {
        case 'number':
            return type === Number;
        case 'string':
            return type === String;
        case 'boolean':
            return type === Boolean;
        case 'undefined':
            return type === undefined;
        default:
            if (x === null && type === null)
                return true;
            if (typeof type === 'function') {
                return type.isPredicateType ? type(x) : x instanceof type;
            }
            return false;
        }
    }
    function predicateType(func) {
        var predicate = function (value) {
            return !!func(value);
        };
        predicate.isPredicateType = true;
        return predicate;
    }
    var List = function () {
            var emptyList = list();
            return predicateType(function (value) {
                return typeof value === 'function' && value.map === emptyList.map;
            });
        }();
    var js = {
            'typeof': function (value) {
                return typeof value;
            },
            'instanceof': function (value, constructor) {
                return value instanceof constructor;
            }
        };
    var print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    var buffer;
    var handlers;
    var subChan;
    var coroutine;
    var id;
    var Channel;
    Channel = function () {
        function Channel(buffer, handlers) {
            if (!(this instanceof Channel))
                return new Channel(buffer, handlers);
            if (buffer === undefined)
                buffer = Array();
            if (handlers === undefined)
                handlers = Array();
            this.buffer = buffer;
            this.handlers = handlers;
        }
        Object.defineProperties(Channel, {});
        Channel.prototype = Object.create(Object.prototype, {
            constructor: { value: Channel },
            'send': {
                value: function (msg) {
                    var self = this;
                    self.buffer.push(msg);
                    self.handlers.length > 0 ? self.handlers.shift()(self.buffer.shift()) : false;
                    return null;
                }
            },
            'receive': {
                value: function (handler) {
                    var subChan;
                    var self = this;
                    subChan = Channel();
                    self.buffer.length > 0 ? setImmediate(function () {
                        return subChan.send(handler(self.buffer.shift()));
                    }) : self.handlers.push(function (msg) {
                        return subChan.send(handler(msg));
                    });
                    return subChan;
                }
            },
            'toString': {
                value: function () {
                    var self = this;
                    return 'Channel(' + (self.buffer + ')');
                }
            },
            'inspect': {
                value: function () {
                    var self = this;
                    return 'Channel(' + (self.buffer + ')');
                }
            }
        });
        return Channel;
    }();
    coroutine = function coroutine(exp, cont) {
        print('co: ', exp);
        if ($sonata_ofType(exp, Channel))
            return exp.receive(cont || id);
        else if (cont)
            return cont(exp);
        else
            return exp;
    };
    id = function id(x) {
        return x;
    };
    exports.Channel = Channel;
    exports.routine = coroutine;
    $sonata_startMain();
}());