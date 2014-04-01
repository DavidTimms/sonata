(function () {
    'use strict';
    var list = require('texo');
    var x, doThing, xs, person;
    print('hello', 'world');
    console.log('hi');
    x > 2 ? hi : false;
    x = 2;
    x === 3 && (45 > 2 || 32 !== 4);
    34 * (3 + 5);
    doThing = function doThing(arg, second, third) {
        var y;
        if (second === undefined)
            second = 34;
        if (third === undefined)
            third = second + 6;
        y = arg < 4 ? 4 : (print('fail'), 23);
        return y;
    };
    xs = list(1, 2, 3, 4, 5);
    xs.map(function (a) {
        return a * a;
    });
    xs.concat(list(6, 7, 8));
    12 + 'b';
    Math.pow(x, 2);
    return person = {
        name: 'Dave',
        age: 21,
        gender: 'male'
    };
}());