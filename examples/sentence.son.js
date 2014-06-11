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
        var all, res, count;
        if (!value)
            return list();
        if ($sonata_ofType(value, List)) {
            count = value.count;
            all = list();
            for (var i = 0; i < count; i++) {
                if (res = rest(value(i))) {
                    all = all.concat(res);
                }
            }
            return all;
        }
        return list(rest(value));
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
    var subjects;
    var qualifiers;
    var opinions;
    var verbs;
    var targets;
    var main;
    var sentences;
    var shuffle;
    var partition;
    subjects = list('Dave', 'Phil', 'Ved', 'Rob', 'Craig', 'Alistair');
    qualifiers = list('really', null, 'kinda', 'probably');
    opinions = list('likes', 'enjoys', 'hates', 'doesn\'t mind');
    verbs = list('playing', 'eating', 'watching', 'making', null);
    targets = list('cake', 'football', 'video games', 'guitar', 'piano', 'pizza');
    main = function main() {
        return shuffle(sentences()).map(function (s) {
            return print(s);
        });
    };
    sentences = function sentences() {
        return findAllWhere(subjects, function (subject) {
            return findAllWhere(qualifiers, function (qualifier) {
                return findAllWhere(opinions, function (opinion) {
                    return findAllWhere(verbs, function (verb) {
                        return findAllWhere(targets, function (target) {
                            return findAllWhere(Math.random() < 0.01, function () {
                                return list(subject, qualifier, opinion, verb, target).filter(Boolean).join(' ');
                            });
                        });
                    });
                });
            });
        });
    };
    shuffle = function shuffle(items) {
        var halves;
        if (items.count < 2)
            return items;
        else
            return halves = partition(items, function () {
                return Math.random() > 0.5;
            }).map(shuffle), halves(0).concat(halves(1));
    };
    partition = function partition(items, predicate) {
        return items.reduce(list(list(), list()), function (prev, item) {
            if (predicate(item))
                return list(prev(0).concat(list(item)), prev(1));
            else
                return list(prev(0), prev(1).concat(list(item)));
        });
    };
    $sonata_startMain();
}());