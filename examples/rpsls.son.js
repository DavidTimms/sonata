(function () {
    'use strict';
    var list = require('texo'), range = list.range, eq = list.eq, mix = function (parent, child) {
            var key;
            var obj = {};
            for (key in parent) {
                obj[key] = parent[key];
            }
            for (key in child) {
                obj[key] = child[key];
            }
            return obj;
        }, addKey = function (parent, newKey, newValue) {
            var obj = {}, key;
            for (key in parent) {
                obj[key] = parent[key];
            }
            obj[newKey] = newValue;
            return obj;
        }, type = function (val) {
            return val === null ? 'null' : typeof val;
        }, print = console.log.bind(console), forIn = function (collection, func) {
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
        }, contains = function (collection, value) {
            if (typeof collection === 'function' && collection.count) {
                for (var i = 0; i < collection.count; i++) {
                    if (list.eq(collection(i), value)) {
                        return true;
                    }
                }
            } else {
                for (var key in collection) {
                    if (list.eq(collection[key], value)) {
                        return true;
                    }
                }
            }
            return false;
        }, repeat = function (func) {
            var result = { args: [] };
            do {
                result = func.apply(null, result.args);
            } while (result instanceof $sonata_Continuation);
            return result;
        }, $sonata_Continuation = function () {
            this.args = arguments;
        }, $sonata_startMain = function () {
            if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
                main.apply(null, process.argv.slice(2));
            }
        }, $sonata_arraySlice = function () {
            var _slice = Array.prototype.slice;
            return function (arrayLike, from, to) {
                return list.fromArray(_slice.call(arrayLike, from, to));
            };
        }();
    var main, randomMove, moves;
    function main(playerMove) {
        var playerBeats, cpuMove, verb;
        playerBeats = moves[playerMove];
        if (!playerBeats) {
            return print('invalid move');
        } else {
            cpuMove = randomMove();
            print('player picks: ' + playerMove);
            print('computer picks: ' + cpuMove);
            return print(eq(playerMove, cpuMove) ? ('it\'s a draw!') : ((verb = playerBeats[cpuMove]) ? ('' + playerMove + ('' + verb + (cpuMove + ', player wins!'))) : ('' + cpuMove + ('' + moves[cpuMove][playerMove] + (playerMove + ', computer wins!')))));
        }
    }
    function randomMove() {
        var options, index;
        options = list.fromArray(Object.keys(moves));
        index = Math.floor(Math.random() * options.count);
        return options(index);
    }
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