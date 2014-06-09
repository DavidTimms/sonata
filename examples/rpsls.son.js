(function () {
    'use strict';
    var list;
    var range;
    var eq;
    var js;
    var print;
    var main;
    var randomMove;
    var moves;
    list = require('texo');
    range = list.range;
    eq = list.eq;
    function mix(parent, child) {
        var key;
        var obj;
        obj = {};
        for (key in parent) {
            obj[key] = parent[key];
        }
        for (key in child) {
            obj[key] = child[key];
        }
        return obj;
    }
    function addKey(parent, newKey, newValue) {
        var obj;
        var key;
        obj = {}, key = undefined;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function contains(collection, value) {
        var i;
        var key;
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
        if (value)
            return next(value);
        else
            return false;
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
        var all;
        var res;
        all = list(), res = undefined;
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
        var i;
        var t;
        var resultArray;
        var keys;
        i = undefined, t = typeof collection, resultArray = [];
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
                keys = Object.keys(collection);
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
    js = {
        'typeof': function (value) {
            return typeof value;
        },
        'instanceof': function (value, constructor) {
            return value instanceof constructor;
        }
    };
    print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    main = undefined, randomMove = undefined, moves = undefined;
    main = function main(playerMove) {
        var playerBeats;
        var cpuMove;
        var verb;
        playerBeats = moves[playerMove];
        if (!playerBeats)
            return print('invalid move');
        else
            return cpuMove = randomMove(), print('player picks: ' + playerMove), print('computer picks: ' + cpuMove), print(eq(playerMove, cpuMove) ? 'it\'s a draw!' : (verb = playerBeats[cpuMove]) ? playerMove + (verb + (cpuMove + ', player wins!')) : cpuMove + (moves[cpuMove][playerMove] + (playerMove + ', computer wins!')));
    };
    randomMove = function randomMove() {
        var options;
        var index;
        options = list.fromArray(Object.keys(moves));
        index = Math.floor(Math.random() * options.count);
        return options(index);
    };
    moves = {
        'Rock': {
            'Lizard': ' crushes ',
            'Scissors': ' crushes '
        },
        'Paper': {
            'Rock': ' covers ',
            'Spock': ' disproves '
        },
        'Scissors': {
            'Paper': ' cut ',
            'Lizard': ' decapitate '
        },
        'Lizard': {
            'Spock': ' poisons ',
            'Paper': ' eats '
        },
        'Spock': {
            'Scissors': ' smashes ',
            'Rock': ' vaporizes '
        }
    };
    $sonata_startMain();
}());