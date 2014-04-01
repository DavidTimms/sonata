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
        };
    var sayHello, person, dave;
    function sayHello(name) {
        if (name === undefined)
            name = 'mate';
        return console.log('Hello', name);
    }
    sayHello();
    sayHello('Dave');
    person = { sayHello: sayHello };
    dave = mix(person, {
        name: 'Dave',
        age: 21
    });
    return console.log(dave);
}());