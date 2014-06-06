(function () {
    'use strict';
    var list = require('texo');
    var range = list.range;
    var eq = list.eq;
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
    function repeat(func) {
        var result = { args: [] };
        do {
            result = func.apply(null, result.args);
        } while (result instanceof $sonata_Continuation);
        return result;
    }
    function $sonata_Continuation() {
        this.args = arguments;
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
    var print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    var dave, origin;
    dave = function Person(name, age, gender) {
        if (!(this instanceof Person))
            return new Person(name, age, gender);
        this.name = name;
        this.age = age;
        this.gender = gender;
    }('Dave', 21, 'male');
    dave.age = 22;
    print(dave.name, 'is a', dave.age, 'year old', dave.gender);
    function Point(x, y) {
        if (!(this instanceof Point))
            return new Point(x, y);
        this.x = x;
        this.y = y;
    }
    origin = Point(0, 0);
    print('origin:', origin);
    $sonata_startMain();
}());