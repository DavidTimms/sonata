(function () {
    'use strict';
    var list;
    var range;
    var eq;
    var print;
    var main;
    var doScoping;
    var withBlock;
    var withPredicate;
    var withFind;
    var withFindAll;
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
    function applied(value, rest) {
        return rest(value);
    }
    function predicate(value, next) {
        if (value)
            return next(value);
        else
            return false;
    }
    function find(value, rest) {
        var res;
        if (!value)
            return false;
        if (value instanceof Iterator) {
            while (value.hasNext()) {
                if (res = rest(value.next())) {
                    return res;
                }
            }
            return false;
        }
        return rest(value);
    }
    function findAll(value, rest) {
        var all;
        var res;
        all = list(), res = undefined;
        if (!value)
            return all;
        if (value instanceof Iterator) {
            while (value.hasNext()) {
                if (res = rest(value.next())) {
                    all = all.concat(res);
                }
            }
            return all;
        }
        return rest(value);
    }
    function Iterator(l) {
        this.items = l;
        this.pointer = 0;
    }
    Iterator.prototype.hasNext = function () {
        return this.items && this.pointer < this.items.count;
    };
    Iterator.prototype.next = function () {
        return this.items && this.items(this.pointer++);
    };
    function from(a) {
        return new Iterator(a);
    }
    function ensure(predicateResult, msg) {
        if (!predicateResult) {
            throw Error(msg || 'ensure failed');
        }
        return true;
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
    main = undefined, doScoping = undefined, withBlock = undefined, withPredicate = undefined, withFind = undefined, withFindAll = undefined;
    function Person(name, age, gender) {
        if (!(this instanceof Person))
            return new Person(name, age, gender);
        this.name = name;
        this.age = age;
        this.gender = gender;
    }
    main = function main() {
        var dave;
        var jane;
        var names;
        var parentDict;
        var validParents;
        ensure(eq(doScoping(2), doScoping(18)));
        ensure(eq(withBlock(5), 21));
        dave = Person('Dave', 21, 'male');
        ensure(withPredicate(dave));
        jane = Person('Jane', 25, 'female');
        ensure(eq(withPredicate(jane), false));
        names = list('John', 'Dan', 'David', 'Dave', 'James', 'Derrick');
        parentDict = {
            'John': list('Lisa', 'Rick'),
            'Dan': list('Sarah', 'Jim'),
            'David': list('Tina', 'Les'),
            'Derrick': list('Lucy', 'Matt')
        };
        ensure(eq(withFind(names), 'David'));
        validParents = list('Tina', 'Les', 'Lucy', 'Matt');
        ensure(eq(withFindAll(names, parentDict), validParents));
        return print('All tests passed');
    };
    doScoping = function doScoping(x) {
        var y;
        y = true;
        x > 10 ? function () {
            var y;
            return y = false;
        }() : false;
        return y;
    };
    withBlock = function withBlock(x) {
        var y;
        var z;
        return applied(+x + +2, function (y) {
            return applied(y * 2, function (z) {
                return +z + +y;
            });
        });
    };
    withPredicate = function withPredicate(person) {
        return predicate(person.age > 18, function () {
            return predicate(eq(person.gender, 'male'), function () {
                return eq(person.name, 'Dave');
            });
        });
    };
    withFind = function withFind(items) {
        var item;
        return find(from(items), function (item) {
            return find(item.length > 4, function () {
                return find(eq(item.charAt(0), 'D'), function () {
                    return item;
                });
            });
        });
    };
    withFindAll = function withFindAll(names, parents) {
        var name;
        return findAll(from(names), function (name) {
            return findAll(name.length > 4, function () {
                return findAll(eq(name.charAt(0), 'D'), function () {
                    return parents[name];
                });
            });
        });
    };
    $sonata_startMain();
}());