(function () {
    'use strict';
    var list = require('texo'), range = list.range;
    var tail, sum, xs;
    function tail(items) {
        return items.slice(1);
    }
    function sum(items, total) {
        while (true) {
            if (total === undefined)
                total = 0;
            if (items.count === 0) {
                return total;
            } else {
                var $temp_items = tail(items);
                total = +total + +items(0);
                items = $temp_items;
            }
        }
    }
    xs = range(5000);
    console.log('sum = ' + sum(xs));
    return console.log({
        name: 'Dave',
        age: 21,
        gender: 'male'
    });
}());