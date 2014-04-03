(function () {
    'use strict';
    var list = require('texo'), range = list.range, mix = function (parent, child) {
            var key;
            var obj = {};
            for (key in parent) {
                obj[key] = parent[key];
            }
            for (key in child) {
                obj[key] = child[key];
            }
            return obj;
        }, type = function (val) {
            return val === null ? 'null' : typeof val;
        }, print = console.log.bind(console), contains = function (collection, value) {
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
        };
    var vowels, input, chars, seperated;
    vowels = list('a', 'e', 'i', 'o', 'u');
    input = list.fromArray(process.argv)(2);
    chars = list.fromArray(input.split(''));
    seperated = chars.reduce({
        con: list(),
        vow: list()
    }, function (stacks, char) {
        if (contains(vowels, char)) {
            return {
                con: stacks.con,
                vow: stacks.vow.append(char)
            };
        } else {
            return {
                con: stacks.con.append(char),
                vow: stacks.vow
            };
        }
    });
    print(seperated.con.join(''));
    return print(seperated.vow.join(''));
}());