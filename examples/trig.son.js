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
    var main, degToRad;
    function main() {
        var dimentions, readDetails;
        var input = $sonata_arraySlice(arguments, 0);
        dimentions = (readDetails = function readDetails(details, dimens) {
            while (true) {
                if (details.count < 2) {
                    return dimens;
                } else {
                    var $temp_details = details.slice(2);
                    dimens = addKey(dimens, details(0), Number(details(1)));
                    details = $temp_details;
                }
            }
        })(input, { 'C': 90 });
        print(dimentions);
        return print(forIn(dimentions, function (key, value) {
            if (eq(key.toUpperCase(), key)) {
                return addKey({}, key, degToRad(value));
            } else {
                return addKey({}, key, value);
            }
        }).reduce(mix));
    }
    function degToRad(deg) {
        return deg * Math.PI / 180;
    }
    $sonata_startMain();
}());