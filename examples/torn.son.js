(function () {
    'use strict';
    var list = require('texo'), range = list.range, mix = function (parent, child) {
            var key;
            var obj = {};
            for (key in parent) {
                obj[key] = parent[key];
            }
            for (key in child) {
                obj[key] = child[key];
            }
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
        };
    var isTorn, findTornNumbers;
    function isTorn(x) {
        var s, slicePoint, left, right;
        s = x.toString();
        slicePoint = Math.floor(s.length / 2);
        left = Number(s.slice(0, slicePoint));
        right = Number(s.slice(slicePoint));
        return x === Math.pow(+left + +right, 2);
    }
    function findTornNumbers(n, x, found) {
        while (true) {
            if (x === undefined)
                x = 10;
            if (found === undefined)
                found = list();
            if (isTorn(x)) {
                if (n === 1) {
                    return found.append(x);
                } else {
                    var $temp_n = n - 1, $temp_x = +x + +1;
                    found = found.append(x);
                    n = $temp_n;
                    x = $temp_x;
                }
            } else {
                var $temp_n = n, $temp_x = +x + +1;
                found = found;
                n = $temp_n;
                x = $temp_x;
            }
        }
    }
    return print(findTornNumbers(5));
}());