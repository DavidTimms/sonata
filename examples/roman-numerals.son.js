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
    var numeralValues;
    numeralValues = Map({
        'I': 1,
        'V': 5,
        'X': 10,
        'L': 50,
        'C': 100,
        'D': 500,
        'M': 1000
    });
    function decodeNumeralWithReduce(str) {
        return str.split('').reverse().map(function (char) {
            return numeralValues.get(char);
        }).reduce(function (total, value, i, values) {
            if (total === undefined)
                total = 0;
            if (value >= (values[i - 1] || 0))
                return +total + +value;
            else
                return total - value;
        });
    }
    function decodeNumeral(remaining, total, previous) {
        var value, newTotal;
        var _tco_temp_remaining, _tco_temp_total, _tco_temp_previous;
        _tailCall_:
            while (true) {
                value = undefined;
                newTotal = undefined;
                value = undefined, newTotal = undefined;
                if (total === undefined)
                    total = 0;
                if (previous === undefined)
                    previous = 0;
                if (remaining) {
                    value = numeralValues.get(remaining.slice(-1));
                    newTotal = value >= previous ? +total + +value : total - value;
                    _tco_temp_remaining = remaining.slice(0, -1);
                    _tco_temp_total = newTotal;
                    _tco_temp_previous = value;
                    remaining = _tco_temp_remaining;
                    total = _tco_temp_total;
                    previous = _tco_temp_previous;
                    continue _tailCall_;
                } else
                    return total;
                return;
            }
    }
    function main() {
        var romanize;
        romanize = require('romanize');
        return Vector(decodeNumeral, decodeNumeralWithReduce).forEach(function (func) {
            console.time(func.name);
            Range(1, 20000).forEach(function (i) {
                return test(romanize(i), i, func);
            });
            return console.timeEnd(func.name);
        });
    }
    function test(input, expected, testFunc) {
        var actual;
        actual = testFunc(input);
        if (eq(actual, expected))
            return true;
        else
            return print('\nTest failed:', input, '\nExpected:', expected, 'Found:', actual);
    }
    $sonata_startMain();
}());