(function () {
    'use strict';
    var list;
    var range;
    var eq;
    var print;
    var isTorn;
    var findTornNumbers;
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
    isTorn = undefined, findTornNumbers = undefined;
    isTorn = function isTorn(x) {
        var s;
        var slicePoint;
        var left;
        var right;
        s = x.toString();
        slicePoint = Math.floor(s.length / 2);
        left = Number(s.slice(0, slicePoint));
        right = Number(s.slice(slicePoint));
        return eq(x, Math.pow(+left + +right, 2));
    };
    findTornNumbers = function findTornNumbers(n, x, found) {
        var _tco_temp_n;
        var _tco_temp_x;
        var _tco_temp_found;
        _tailCall_:
            while (true) {
                if (x === undefined)
                    x = 10;
                if (found === undefined)
                    found = list();
                if (isTorn(x))
                    if (eq(n, 1))
                        return found.append(x);
                    else {
                        _tco_temp_n = n - 1;
                        _tco_temp_x = +x + +1;
                        _tco_temp_found = found.append(x);
                        n = _tco_temp_n;
                        x = _tco_temp_x;
                        found = _tco_temp_found;
                        continue _tailCall_;
                    }
                else {
                    x = +x + +1;
                    continue _tailCall_;
                }
                return;
            }
    };
    print(findTornNumbers(5));
    $sonata_startMain();
}());