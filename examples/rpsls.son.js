(function () {
    'use strict';
    list = require('texo');
    range = list.range;
    eq = list.eq;
    function mix(parent, child) {
        key = undefined;
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
        obj = {}, key = undefined;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function type(val) {
        if (val === null)
            return 'null';
        else
            return typeof val;
    }
    function contains(collection, value) {
        i = undefined, key = undefined;
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
    function repeat(func) {
        result = { args: [] };
        do {
            result = func.apply(null, result.args);
        } while (result instanceof $sonata_Continuation);
        return result;
    }
    function $sonata_Continuation() {
        this.args = arguments;
    }
    function forIn(collection, func) {
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
    print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    main = undefined, randomMove = undefined, moves = undefined;
    function main(playerMove) {
        playerBeats = undefined, cpuMove = undefined, verb = undefined;
        playerBeats = moves[playerMove];
        if (!playerBeats) {
            return print('invalid move');
        } else {
            cpuMove = randomMove();
            print('player picks: ' + playerMove);
            print('computer picks: ' + cpuMove);
            return print(eq(playerMove, cpuMove) ? ('it\'s a draw!') : ((verb = playerBeats[cpuMove]) ? (playerMove + (verb + (cpuMove + ', player wins!'))) : (cpuMove + (moves[cpuMove][playerMove] + (playerMove + ', computer wins!')))));
        }
    }
    function randomMove() {
        options = undefined, index = undefined;
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