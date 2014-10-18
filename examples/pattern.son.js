(function () {
    'use strict';
    var $sonata_Immutable = require('immutable'), Sequence = $sonata_Immutable.Sequence, Vector = $sonata_Immutable.Vector, IndexedSequence = Sequence(1).concat(1).constructor, Map = $sonata_Immutable.Map, OrderedMap = $sonata_Immutable.OrderedMap, Range = $sonata_Immutable.Range, Repeat = $sonata_Immutable.Repeat, Record = $sonata_Immutable.Record, Set = $sonata_Immutable.Set, eq = $sonata_Immutable.is;
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
    function Struct() {
    }
    Struct.clone = function (structure) {
        var newStruct = new structure.constructor();
        for (var property in structure) {
            newStruct[property] = structure[property];
        }
        return newStruct;
    };
    Struct.prototype = Object.create(Object.prototype, {
        get: {
            value: function (property) {
                return this[property];
            }
        },
        set: {
            value: function (changed, newValue) {
                var property, newStruct = Struct.clone(this);
                if (arguments.length > 1) {
                    newStruct[changed] = newValue;
                } else {
                    for (property in changed) {
                        newStruct[property] = changed[property];
                    }
                }
                return newStruct;
            }
        },
        update: {
            value: function (changed, updater) {
                if (arguments.length > 1) {
                    return this.set(changed, updater(this[changed], changed, this));
                } else {
                    var newStruct = Struct.clone(this);
                    for (var property in changed) {
                        newStruct[property] = changed[property](this[property], property, this);
                    }
                    return newStruct;
                }
            }
        }
    });
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
    var bitwise = {
            or: function (a, b) {
                return a | b;
            },
            and: function (a, b) {
                return a & b;
            },
            xor: function (a, b) {
                return a ^ b;
            },
            not: function (a) {
                return ~a;
            },
            leftShift: function (a, b) {
                return a << b;
            },
            rightShift: function (a, b) {
                return a >> b;
            },
            rightShiftZF: function (a, b) {
                return a >>> b;
            }
        };
    var print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    var a, b, $sonata_var0;
    a = b = 1;
    $sonata_var0 = Vector('foo', 'bar');
    if ($sonata_ofType($sonata_var0, IndexedSequence) && $sonata_var0.length === 2) {
        a = $sonata_var0.get(0);
        b = $sonata_var0.get(1);
    } else
        throw new Error('failed to match pattern');
    print(a);
    print(b);
    $sonata_startMain();
}());