(function () {
    'use strict';
    var print, sayHello;
    print = require('./print.js');
    sayHello = function (name) {
        if (arguments.length < 1)
            name = 'mate';
        return print('Hello', name);
    };
    sayHello();
    return sayHello('Dave');
}());