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
        var all = list(), res;
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
            return typeof type === 'function' && x instanceof type;
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
    var dave;
    var gender;
    var origin;
    var myPosition;
    var Point;
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
    Point = function () {
        function Point(x, y) {
            if (!(this instanceof Point))
                return new Point(x, y);
            this.x = x;
            this.y = y;
        }
        Object.defineProperties(Point, {
            'random': {
                value: function () {
                    var Point = this;
                    return Point(Math.round(Math.random() * 10), Math.round(Math.random() * 10));
                }
            }
        });
        Point.prototype = Object.create(Object.prototype, {
            constructor: { value: Point },
            'distanceTo': {
                value: function (other) {
                    var self = this;
                    return Math.sqrt(+Math.pow(self.x - other.x, 2) + +Math.pow(self.y - other.y, 2));
                }
            }
        });
        return Point;
    }();
    origin = Point(0, 0);
    myPosition = Point(4, 3);
    print('distance to origin:', myPosition.distanceTo(origin));
    print('random point: ', Point.random());
    print(Object.keys(Point));
    $sonata_startMain();
}());