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
    var initialNumCounters;
    var getIndex;
    var colours;
    var container;
    var countClicks;
    var up;
    var down;
    var counts;
    var numCounters;
    var deleted;
    var counterList;
    var visibleCounters;
    var sumCounts;
    var ractive;
    initialNumCounters = 3;
    getIndex = function getIndex(event) {
        var id;
        id = event.currentTarget.parentElement.id;
        return Number(id.substring('counter-'.length));
    };
    colours = Vector('red', 'green', 'blue', 'yellow');
    container = $('#counters-container');
    countClicks = function countClicks(clickCounts, index) {
        return clickCounts.set(index, +(clickCounts.get(index) || 0) + +1);
    };
    up = container.asEventStream('click', '.counter .up').map(getIndex).scan(Map(), countClicks);
    down = container.asEventStream('click', '.counter .down').map(getIndex).scan(Map(), countClicks);
    counts = Bacon.combineWith(function (up, down) {
        return Range().map(function (i) {
            return (up.get(i) || 0) - (down.get(i) || 0);
        });
    }, up, down);
    numCounters = container.asEventStream('click', '.add-counter').map(1).scan(initialNumCounters, function (a, b) {
        return +a + +b;
    });
    deleted = container.asEventStream('click', '.counter .delete').map(getIndex).scan(Map(), function (deletions, index) {
        return deletions.set(index, true);
    });
    counterList = function counterList(numCounters, counts, deleted) {
        return Range(0, numCounters).map(function (i) {
            return {
                'index': i,
                'count': counts.get(i),
                'colour': colours.get(i % colours.length)
            };
        }).filter(function (data, i) {
            return !deleted.get(i);
        });
    };
    visibleCounters = Bacon.combineWith(counterList, numCounters, counts, deleted);
    sumCounts = visibleCounters.map(function (countersData) {
        return countersData.reduce(function (total, current) {
            return +total + +current.count;
        }, 0);
    });
    ractive = new Ractive({
        'el': 'counters-container',
        'template': '#counters-template',
        'adapt': 'Bacon',
        'data': {
            'counters': visibleCounters.map(function (vec) {
                return vec.toArray();
            }),
            'totalCount': sumCounts
        }
    });
    $sonata_startMain();
}());