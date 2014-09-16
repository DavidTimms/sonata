(function () {
    'use strict';
    var list = require('texo');
    var range = list.range;
    var eq = list.eq;
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
    var initialNumCounters;
    var getIndex;
    var cycle;
    var colours;
    var zeros;
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
    cycle = function cycle(items) {
        return function (i) {
            return items(Math.floor(i % items.count));
        };
    };
    colours = cycle(list('red', 'green', 'blue', 'yellow'));
    zeros = range().lazyMap(function () {
        return 0;
    });
    container = $('#counters-container');
    countClicks = function countClicks(clickCounts, index) {
        return clickCounts.replace(index, +clickCounts(index) + +1);
    };
    up = container.asEventStream('click', '.counter .up').map(getIndex).scan(zeros, countClicks);
    down = container.asEventStream('click', '.counter .down').map(getIndex).scan(zeros, countClicks);
    counts = Bacon.combineWith(function (up, down) {
        return zeros.lazyMap(function (zero, i) {
            return up(i) - down(i);
        });
    }, up, down);
    numCounters = container.asEventStream('click', '.add-counter').map(1).scan(initialNumCounters, function (a, b) {
        return +a + +b;
    });
    deleted = container.asEventStream('click', '.counter .delete').map(getIndex).scan(list(), function (deletions, index) {
        return deletions.replace(index, true);
    });
    counterList = function counterList(numCounters, counts, deleted) {
        return range(numCounters).lazyMap(function (i) {
            return {
                'index': i,
                'count': counts(i),
                'colour': colours(i)
            };
        }).filter(function (data, i) {
            return !deleted(i);
        });
    };
    visibleCounters = Bacon.combineWith(counterList, numCounters, counts, deleted);
    sumCounts = visibleCounters.map(function (countersData) {
        return countersData.reduce(0, function (total, current) {
            return +total + +current.count;
        });
    });
    ractive = new Ractive({
        'el': 'counters-container',
        'template': '#counters-template',
        'adapt': 'Bacon',
        'data': {
            'counters': visibleCounters.map('.toArray'),
            'totalCount': sumCounts
        }
    });
    $sonata_startMain();
}());