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
        };
    var evaluate, str, parts;
    function evaluate(op, i, stack, tokens) {
        while (true) {
            var result;
            if (tokens(i)) {
                var result;
                if (tokens(i) === op) {
                    var result;
                    result = eval('' + Number(stack(-1)) + ('' + op + Number(tokens(+i + +1))));
                    var $temp_op = op, $temp_i = +i + +2, $temp_stack = stack.replace(-1, result);
                    tokens = tokens;
                    op = $temp_op;
                    i = $temp_i;
                    stack = $temp_stack;
                } else {
                    var $temp_op = op, $temp_i = +i + +1, $temp_stack = stack.append(tokens(i));
                    tokens = tokens;
                    op = $temp_op;
                    i = $temp_i;
                    stack = $temp_stack;
                }
            } else {
                return stack;
            }
        }
    }
    str = list.fromArray(process.argv)(2);
    parts = list.fromArray(str.split(' '));
    return console.log(evaluate('+', 0, list(), evaluate('-', 0, list(), evaluate('/', 0, list(), evaluate('*', 0, list(), parts))))(0));
}());