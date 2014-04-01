(function () {
    'use strict';
    var list = require('texo');
    var tail, sum, xs;
    tail = function tail(items) {
        return items.slice(1);
    };
    sum = function sum(items, total) {
        while (true) {
            if (total === undefined)
                total = 0;
            if (items.count === 0) {
                return total;
            } else {
                var $temp_items = tail(items);
                total = total + items(0);
                items = $temp_items;
            }
        }
    };
    xs = list.range(5000);
    return console.log('sum = ' + sum(xs));
}());