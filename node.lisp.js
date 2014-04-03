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
    var sayHello, name, person, x;
    sayHello = function (name) {
        if (name === undefined)
            name = 'mate';
        return console.log('Hello', name);
    };
    sayHello();
    sayHello('Dave');
    person = {
        sayHello: sayHello,
        name: 'John'
    };
    repeat(function (x) {
        if (x === undefined)
            x = 0;
        print(x);
        if (x < 10) {
            return new $sonata_Continuation(+x + +1);
        } else {
            return false;
        }
    });
    forIn(list('a', 'b', 'c', 'd'), function (x) {
        return print(x);
    });
    forIn(person, function (key) {
        return print(key, '->', person[key]);
    });
    return forIn('foo', function (chr) {
        return print(chr);
    });
}());