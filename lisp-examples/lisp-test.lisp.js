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
    var x, doThing, xs, person, regex;
    print('hello', 'world');
    console.log('hi');
    !(x > 2) ? hi : false;
    x = 2;
    x === 3 && (45 > 2 || 32 !== 4);
    34 * (+3 + +5);
    function doThing(arg, second, third) {
        var y;
        if (second === undefined)
            second = 34;
        if (third === undefined)
            third = +second + +6;
        y = arg < 4 ? 4 : (print('fail'), 23);
        return y;
    }
    xs = list(1, 2, 3, 4, 5);
    xs.map(function (a) {
        return a * a;
    });
    xs.concat(list(6, 7, 8));
    12 + 'b';
    Math.pow(x, 2);
    person = {
        name: 'Dave',
        age: 21,
        gender: 'male'
    };
    mix(person, { height: 180 });
    regex = /\/^hi/;
    return 'multi\n\t\tline\n\t\t\tstring';
}());