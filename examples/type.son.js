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
    var dave, gender, origin, myPosition;
    dave = function () {
        function Person(name, age, gender) {
            if (!(this instanceof Person))
                return new Person(name, age, gender);
            if (gender === undefined)
                gender = 'male';
            this.name = name;
            this.age = age;
            this.gender = gender;
        }
        Object.defineProperties(Person, {});
        Person.prototype = Object.create(Object.prototype, { constructor: { value: Person } });
        return Person;
    }()('Dave', 21);
    print(dave.name, 'is a', dave.age, 'year old', dave.gender);
    var Point = function () {
            function Point(x, y) {
                if (!(this instanceof Point))
                    return new Point(x, y);
                this.x = x;
                this.y = y;
            }
            Object.defineProperties(Point, {
                'random': {
                    value: function random() {
                        var Point = this;
                        return Point(round(Math.random() * 10), round(Math.random() * 10));
                    }
                }
            });
            Point.prototype = Object.create(Object.prototype, {
                constructor: { value: Point },
                'distanceTo': {
                    value: function distanceTo(other) {
                        var self = this;
                        return sqrt(+Math.pow(self.x - other.x, 2) + +Math.pow(self.y - other.y, 2));
                    }
                }
            });
            return Point;
        }();
    origin = Point(0, 0);
    myPosition = Point(4, 3);
    print('distance to origin:', myPosition.distanceTo(origin));
    print('random point: ', Point.random());
    $sonata_startMain();
}());