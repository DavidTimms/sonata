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
        };
    var pascal, getCell;
    function pascal(n, rowCount, prev) {
        while (true) {
            var next;
            if (rowCount === undefined)
                rowCount = 2;
            if (prev === undefined)
                prev = list(list(1));
            if (rowCount > n) {
                return prev;
            } else {
                next = range(rowCount).map(function (rowNum) {
                    return range(+rowNum + +1).map(function (colNum) {
                        return +getCell(prev, rowNum, colNum) + +(+getCell(prev, rowNum - 1, colNum) + +getCell(prev, rowNum - 1, colNum - 1));
                    });
                });
                var $temp_n = n, $temp_rowCount = +rowCount + +1;
                prev = next;
                n = $temp_n;
                rowCount = $temp_rowCount;
            }
        }
    }
    function getCell(pyramid, x, y) {
        return x >= 0 && (y >= 0 && (pyramid(x) && pyramid(x)(y))) || 0;
    }
    return print(pascal(14).map(function (row) {
        return row.join('\t\t');
    }).join('\n'));
}());