(function () {
    'use strict';
    var list;
    var range;
    var eq;
    var print;
    var dbl_$U45_num;
    var abs;
    var xs;
    var merge;
    var yo;
    list = require('texo');
    range = list.range;
    eq = list.eq;
    function mix(parent, child) {
        var key;
        var obj;
        obj = {};
        for (key in parent) {
            obj[key] = parent[key];
        }
        for (key in child) {
            obj[key] = child[key];
        }
        return obj;
    }
    function addKey(parent, newKey, newValue) {
        var obj;
        var key;
        obj = {}, key = undefined;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function contains(collection, value) {
        var i;
        var key;
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
    function repeat(func) {
        var result;
        result = { args: [] };
        do {
            result = func.apply(null, result.args);
        } while (result instanceof $sonata_Continuation);
        return result;
    }
    function $sonata_Continuation() {
        this.args = arguments;
    }
    function forIn(collection, func) {
        var i;
        var t;
        var resultArray;
        var keys;
        i = undefined, t = typeof collection, resultArray = [];
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
                keys = Object.keys(collection);
                for (i = 0; i < keys.length; i++) {
                    resultArray.push(func(keys[i], collection[keys[i]]));
                }
                return resultArray;
            }
        case 'function':
            return collection.map(func);
        }
    }
    print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    dbl_$U45_num = undefined, abs = undefined, xs = undefined, merge = undefined, yo = undefined;
    dbl_$U45_num = function dbl_$U45_num(x) {
        return +x + +x;
    };
    abs = function abs(x) {
        if (x >= 0)
            return x;
        else
            return -x;
    };
    xs = list(0, 12, -4, 8.3, -2);
    print(xs.map(abs).map(dbl_$U45_num));
    merge = function merge() {
        var $sonata_i;
        var $sonata_restArray;
        var lists;
        $sonata_i = undefined, $sonata_restArray = [];
        for ($sonata_i = 0; $sonata_i < arguments.length; $sonata_i++) {
            $sonata_restArray.push(arguments[$sonata_i]);
        }
        lists = list.fromArray($sonata_restArray);
        return lists.reduce(function (a, b) {
            return a.concat(b);
        });
    };
    print(merge(xs, list(56, 34), list(99, 88, 77)));
    true ? yo = function yo() {
        return huh;
    } : false;
    $sonata_startMain();
}());