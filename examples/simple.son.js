(function () {
    'use strict';
    var list = require('texo'), range = list.range, eq = list.eq, mix = function (parent, child) {
            var key;
            var obj = {};
            for (key in parent) {
                obj[key] = parent[key];
            }
            for (key in child) {
                obj[key] = child[key];
            }
            return obj;
        }, addKey = function (parent, newKey, newValue) {
            var obj = {}, key;
            for (key in parent) {
                obj[key] = parent[key];
            }
            obj[newKey] = newValue;
            return obj;
        }, type = function (val) {
            return val === null ? 'null' : typeof val;
        }, print = console.log.bind(console), forIn = function (collection, func) {
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
        }, contains = function (collection, value) {
            if (typeof collection === 'function' && collection.count) {
                for (var i = 0; i < collection.count; i++) {
                    if (list.eq(collection(i), value)) {
                        return true;
                    }
                }
            } else {
                for (var key in collection) {
                    if (list.eq(collection[key], value)) {
                        return true;
                    }
                }
            }
            return false;
        }, repeat = function (func) {
            var result = { args: [] };
            do {
                result = func.apply(null, result.args);
            } while (result instanceof $sonata_Continuation);
            return result;
        }, $sonata_Continuation = function () {
            this.args = arguments;
        }, $sonata_startMain = function () {
            if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
                main.apply(null, process.argv.slice(2));
            }
        }, $sonata_arraySlice = function () {
            var _slice = Array.prototype.slice;
            return function (arrayLike, from, to) {
                return list.fromArray(_slice.call(arrayLike, from, to));
            };
        }();
    var square_$U45_num, abs, xs, merge;
    function square_$U45_num(x) {
        return x * x;
    }
    function abs(x) {
        if (x >= 0) {
            return x;
        } else {
            return -x;
        }
    }
    xs = list(0, 12, -4, 8.3, -2);
    print(xs.map(abs).map(square_$U45_num));
    function merge() {
        var $sonata_arguments = [];
        for (var $sonata_index = 0; $sonata_index < arguments.length; $sonata_index++) {
            $sonata_arguments.push(arguments[$sonata_index]);
        }
        var lists = list.fromArray($sonata_arguments);
        return lists.reduce(function (a, b) {
            return a.concat(b);
        });
    }
    print(merge(xs, list(56, 34), list(99, 88, 77)));
    $sonata_startMain();
}());