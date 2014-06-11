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
        var all = list(), res, count;
        if (!value)
            return all;
        if ($sonata_ofType(value, List)) {
            count = value.count;
            for (var i = 0; i < count; i++) {
                if (res = rest(value(i))) {
                    all = all.concat(res);
                }
            }
            return all;
        }
        return rest(value);
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
    var main;
    var doScoping;
    var isDave;
    var findName;
    var findParents;
    var maths;
    var country;
    var Person;
    Person = function () {
        function Person(name, age, gender) {
            if (!(this instanceof Person))
                return new Person(name, age, gender);
            this.name = name;
            this.age = age;
            this.gender = gender;
        }
        Object.defineProperties(Person, {});
        Person.prototype = Object.create(Object.prototype, { constructor: { value: Person } });
        return Person;
    }();
    main = function main() {
        var dave;
        var jane;
        var names;
        var parentDict;
        var validParents;
        ensure(eq(doScoping(2), doScoping(18)));
        dave = Person('Dave', 21, 'male');
        ensure(isDave(dave));
        jane = Person('Jane', 25, 'female');
        ensure(eq(isDave(jane), false));
        names = list('John', 'Dan', 'David', 'Dave', 'James', 'Derrick');
        parentDict = {
            'John': list('Lisa', 'Rick'),
            'Dan': list('Sarah', 'Jim'),
            'David': list('Tina', 'Les'),
            'Derrick': list('Lucy', 'Matt')
        };
        ensure(eq(findName(names), 'David'));
        validParents = list('Tina', 'Les', 'Lucy', 'Matt');
        ensure(eq(findParents(names, parentDict), validParents));
        ensure(eq(maths.add(maths[45], 2), 34));
        ensure(eq(country('China', 'Asia').describe(), 'China is a country in Asia'));
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
    isDave = function isDave(person) {
        return predicate(person.age > 18, function () {
            return predicate(eq(person.gender, 'male'), function () {
                return eq(person.name, 'Dave');
            });
        });
    };
    findName = function findName(items) {
        return findWhere(items, function (item) {
            return findWhere(item.length > 4, function () {
                return findWhere(eq(item.charAt(0), 'D'), function () {
                    return item;
                });
            });
        });
    };
    findParents = function findParents(names, parents) {
        return findAllWhere(names, function (name) {
            return findAllWhere(name.length > 4, function () {
                return findAllWhere(eq(name.charAt(0), 'D'), function () {
                    return parents[name];
                });
            });
        });
    };
    maths = {
        'add': function (a, b) {
            var self;
            self = this;
            return +a + +b;
        },
        45: 32
    };
    country = function country(name, continent) {
        return {
            'name': name,
            'describe': function () {
                var self;
                self = this;
                return name + (' is a country in ' + continent);
            }
        };
    };
    $sonata_startMain();
}());