(function () {
    'use strict';
    var $sonata_Immutable = require('immutable');
    var Sequence = $sonata_Immutable.Sequence;
    var Vector = $sonata_Immutable.Vector;
    var Map = $sonata_Immutable.Map;
    var OrderedMap = $sonata_Immutable.OrderedMap;
    var Range = $sonata_Immutable.Range;
    var Repeat = $sonata_Immutable.Repeat;
    var Record = $sonata_Immutable.Record;
    var eq = $sonata_Immutable.is;
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
    var subjects;
    var qualifiers;
    var opinions;
    var verbs;
    var targets;
    var main;
    var sentences;
    var shuffle;
    var partition;
    subjects = Vector('Dave', 'Phil', 'Ved', 'Rob', 'Craig', 'Alistair');
    qualifiers = Vector('really', null, 'kinda', 'probably');
    opinions = Vector('likes', 'enjoys', 'hates', 'doesn\'t mind');
    verbs = Vector('playing', 'eating', 'watching', 'making', null);
    targets = Vector('cake', 'football', 'video games', 'guitar', 'piano', 'pizza');
    main = function main() {
        return shuffle(sentences()).forEach(function (s) {
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
                                return Vector(subject, qualifier, opinion, verb, target).filter(Boolean).join(' ');
                            });
                        });
                    });
                });
            });
        });
    };
    shuffle = function shuffle(items) {
        var halves;
        if (items.length < 2)
            return items;
        else
            return halves = partition(items, function () {
                return Math.random() > 0.5;
            }).map(shuffle), halves.get(0).concat(halves.get(1));
    };
    partition = function partition(items, predicate) {
        return items.reduce(function (prev, item) {
            if (predicate(item))
                return Vector(prev.get(0).concat(Vector(item)), prev.get(1));
            else
                return Vector(prev.get(0), prev.get(1).concat(Vector(item)));
        }, Vector(Vector(), Vector()));
    };
    $sonata_startMain();
}());