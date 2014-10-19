(function () {
    'use strict';
    var $sonata_Immutable = require('immutable'), Sequence = $sonata_Immutable.Sequence, Vector = $sonata_Immutable.Vector, IndexedSequence = Sequence(1).concat(1).constructor, Map = $sonata_Immutable.Map, OrderedMap = $sonata_Immutable.OrderedMap, Range = $sonata_Immutable.Range, Repeat = $sonata_Immutable.Repeat, Record = $sonata_Immutable.Record, Set = $sonata_Immutable.Set, eq = $sonata_Immutable.is;
    var sqrt = Math.sqrt, floor = Math.floor, ceil = Math.ceil, round = Math.round, max = Math.max, min = Math.min, random = Math.random;
    function tryCatch(tryBody, catchBody) {
        try {
            return tryBody();
        } catch (e) {
            return catchBody(e);
        }
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
    var utils, wrapStringTokens, printObject, isCallTo, isOperator, matchers, Matcher;
    utils = require('../utils/utils');
    wrapStringTokens = utils.wrapStringTokens;
    printObject = utils.printObject;
    isCallTo = utils.isCallTo;
    isOperator = utils.isOperator;
    module.exports = matchPattern;
    function main(shouldTest) {
        if (eq(shouldTest, 'TEST')) {
            test('a', 'val');
            return test('[a, b]', 'val');
        } else
            return false;
    }
    function test(pattern, expression) {
        var tokenize, parse;
        tokenize = require('../tokenizer');
        parse = require('../parser');
        return printObject(matchPattern(parse(tokenize(pattern))[0], wrapStringTokens(expression)));
    }
    function matchPattern(pattern, expression) {
        return matchers.find(function (matcher) {
            return matcher.filterPredicate(pattern);
        }).matcherFunc(pattern, expression);
    }
    Matcher = function () {
        function Matcher(filterPredicate, matcherFunc) {
            if (!(this instanceof Matcher))
                return new Matcher(filterPredicate, matcherFunc);
            this.filterPredicate = filterPredicate;
            this.matcherFunc = matcherFunc;
        }
        Object.defineProperties(Matcher, {});
        Matcher.prototype = Object.create(Struct.prototype, { constructor: { value: Matcher } });
        return Matcher;
    }();
    matchers = Vector();
    function defineMatcher(filterPredicate, matcherFunc) {
        return matchers = matchers.push(Matcher(filterPredicate, matcherFunc));
    }
    defineMatcher(function (pattern) {
        return eq(pattern.type, 'Identifier');
    }, function (pattern, expression) {
        return {
            'conditions': Array(),
            'assignments': Array(exp('=', pattern, expression))
        };
    });
    defineMatcher(function (pattern) {
        return eq(pattern.type, 'Literal');
    }, function (pattern, expression) {
        return {
            'conditions': Array(exp('===', expression, pattern)),
            'assignments': Array()
        };
    });
    defineMatcher(isCallTo('Vector'), function (pattern, expression) {
        var subPatterns, initialState;
        subPatterns = pattern.slice(1);
        initialState = {
            'conditions': Array(exp('::', expression, 'IndexedSequence'), subPatterns.some(isCallTo('...')) ? exp('>=', exp('.', expression, 'length'), subPatterns.length - 1) : exp('===', exp('.', expression, 'length'), subPatterns.length)),
            'assignments': Array()
        };
        return subPatterns.reduce(function (state, subPattern, i) {
            var subMatch, sliceEndIndex, sliceExp;
            subMatch = isCallTo('...', subPattern) ? (sliceEndIndex = +i + +1 - subPatterns.length, sliceExp = sliceEndIndex < 0 ? exp(exp('.', expression, 'slice'), i, sliceEndIndex) : exp(exp('.', expression, 'slice'), i), matchPattern(subPattern[1], sliceExp)) : matchPattern(subPattern, exp(exp('.', expression, 'get'), i));
            return {
                'conditions': state.conditions.concat(subMatch.conditions),
                'assignments': state.assignments.concat(subMatch.assignments)
            };
        }, initialState);
    });
    defineMatcher(function (pattern) {
        return $sonata_ofType(pattern, Array) && isOperator(pattern[0]);
    }, function (pattern, expression) {
        return function () {
            throw SyntaxError('Invalid pattern');
        }();
    });
    defineMatcher(always, function (pattern, expression) {
        return fail;
    });
    function exp(subExps) {
        var $sonata_i, $sonata_restArray;
        $sonata_i = undefined, $sonata_restArray = [];
        for ($sonata_i = 0; $sonata_i < arguments.length; $sonata_i++) {
            $sonata_restArray.push(arguments[$sonata_i]);
        }
        subExps = Vector.from($sonata_restArray);
        return wrapStringTokens(subExps.toArray());
    }
    function always() {
        return true;
    }
    $sonata_startMain();
}());