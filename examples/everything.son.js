(function () {
    'use strict';
    var $sonata_Immutable = require('immutable'), Sequence = $sonata_Immutable.Sequence, Vector = $sonata_Immutable.Vector, Map = $sonata_Immutable.Map, OrderedMap = $sonata_Immutable.OrderedMap, Range = $sonata_Immutable.Range, Repeat = $sonata_Immutable.Repeat, Record = $sonata_Immutable.Record, Set = $sonata_Immutable.Set, eq = $sonata_Immutable.is;
    Sequence.prototype.$sonata_map_ = function (mapper, thisArg) {
        return this.map(mapper, thisArg);
    };
    var sqrt = Math.sqrt, floor = Math.floor, ceil = Math.ceil, round = Math.round, max = Math.max, min = Math.min, random = Math.random;
    function tryCatch(tryBody, catchBody) {
        try {
            return tryBody();
        } catch (e) {
            return catchBody(e);
        }
    }
    function obj() {
        return Object;
    }
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
    function applied(value, rest) {
        return rest(value);
    }
    function predicate(value, next) {
        return value ? next(value) : false;
    }
    function findWhere(value, rest) {
        if (!value)
            return false;
        if ($sonata_ofType(value, Sequence)) {
            return value.find(function (condidate) {
                return rest(condidate);
            });
        }
        return rest(value);
    }
    function findAllWhere(value, rest) {
        if (!value)
            return Vector();
        if ($sonata_ofType(value, Sequence)) {
            return value.reduce(function (all, condidate) {
                return all.concat(rest(condidate));
            }, Vector());
        }
        return rest(value);
    }
    function ensure(predicateResult, msg) {
        if (!predicateResult) {
            throw Error(msg || 'ensure failed');
        }
        return true;
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
                return x instanceof type;
            }
            return false;
        }
    }
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
    var maths;
    var Person = function () {
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
    function main() {
        var dave, jane, names, parentDict, validParents;
        ensure(eq(doScoping(2), doScoping(18)));
        dave = Person('Dave', 21, 'male');
        ensure(isDave(dave));
        jane = Person('Jane', 25, 'female');
        ensure(eq(isDave(jane), false));
        names = Vector('John', 'Dan', 'David', 'Dave', 'James', 'Derrick');
        parentDict = {
            'John': Vector('Lisa', 'Rick'),
            'Dan': Vector('Sarah', 'Jim'),
            'David': Vector('Tina', 'Les'),
            'Derrick': Vector('Lucy', 'Matt')
        };
        ensure(eq(findName(names), 'David'));
        validParents = Vector('Tina', 'Les', 'Lucy', 'Matt');
        ensure(eq(findParents(names, parentDict), validParents));
        ensure(eq(maths.add(maths[45], 2), 34));
        ensure(eq(country('China', 'Asia').describe(), 'China is a country in Asia'));
        ensure(eq(Map({
            'a': 11,
            'b': 44
        }).get('a'), 11));
        ensure(eq(Vector(1, 2, 3).get(2), 3));
        ensure(eq(Math.floor(Math.pow(sqrt(20), 2)), 20));
        ensure(eq(mutatingDouble(5), 10));
        return print('All tests passed');
    }
    function doScoping(x) {
        var y;
        y = true;
        x > 10 ? function () {
            var y;
            return y = false;
        }() : false;
        return y;
    }
    function isDave(person) {
        return predicate(person.age > 18, function () {
            return predicate(eq(person.gender, 'male'), function () {
                return eq(person.name, 'Dave');
            });
        });
    }
    function findName(items) {
        return findWhere(items, function (item) {
            return findWhere(item.length > 4, function () {
                return findWhere(eq(item.charAt(0), 'D'), function () {
                    return item;
                });
            });
        });
    }
    function findParents(names, parents) {
        return findAllWhere(names, function (name) {
            return findAllWhere(name.length > 4, function () {
                return findAllWhere(eq(name.charAt(0), 'D'), function () {
                    return parents[name];
                });
            });
        });
    }
    maths = {
        'add': function add(a, b) {
            var self = this;
            return +a + +b;
        },
        45: 32
    };
    function blob() {
        var self = this;
        return yo();
    }
    function country(name, continent) {
        ensure($sonata_ofType(name, String), 'Country name must be a String');
        ensure($sonata_ofType(continent, String), 'Continent name must be a String');
        return {
            'name': name,
            'describe': function describe() {
                var self = this;
                return name.concat(' is a country in ').concat(continent);
            },
            'foo': function foo() {
                return bah();
            }
        };
    }
    function mutatingDouble(x) {
        (function () {
            return x = x * 2;
        }());
        return x;
    }
    $sonata_startMain();
}());