(function () {
    'use strict';
    var $sonata_Immutable = require('immutable'), Sequence = $sonata_Immutable.Sequence, Vector = $sonata_Immutable.Vector, Map = $sonata_Immutable.Map, OrderedMap = $sonata_Immutable.OrderedMap, Range = $sonata_Immutable.Range, Repeat = $sonata_Immutable.Repeat, Record = $sonata_Immutable.Record, Set = $sonata_Immutable.Set, eq = $sonata_Immutable.is;
    var sqrt = Math.sqrt, floor = Math.floor, ceil = Math.ceil, round = Math.round, max = Math.max, min = Math.min, random = Math.random;
    function tryCatch(tryBody, catchBody) {
        try {
            return tryBody();
        } catch (e) {
            return catchBody(e);
        }
    }
    function obj() {
        return Object;
    }
    function mix(parent, child) {
        var key;
        var obj = {};
        for (key in parent) {
            obj[key] = parent[key];
        }
        for (key in child) {
            obj[key] = child[key];
        }
        return obj;
    }
    function addKey(parent, newKey, newValue) {
        var obj = {}, key;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function applied(value, rest) {
        return rest(value);
    }
    function predicate(value, next) {
        return value ? next(value) : false;
    }
    function findWhere(value, rest) {
        if (!value)
            return false;
        if ($sonata_ofType(value, Sequence)) {
            return value.find(function (condidate) {
                return rest(condidate);
            });
        }
        return rest(value);
    }
    function findAllWhere(value, rest) {
        if (!value)
            return Vector();
        if ($sonata_ofType(value, Sequence)) {
            return value.reduce(function (all, condidate) {
                return all.concat(rest(condidate));
            }, Vector());
        }
        return rest(value);
    }
    function ensure(predicateResult, msg) {
        if (!predicateResult) {
            throw Error(msg || 'ensure failed');
        }
        return true;
    }
    function $sonata_ofType(x, type) {
        switch (typeof x) {
        case 'number':
            return type === Number;
        case 'string':
            return type === String;
        case 'boolean':
            return type === Boolean;
        case 'undefined':
            return type === undefined;
        default:
            if (x === null && type === null)
                return true;
            if (typeof type === 'function') {
                return x instanceof type;
            }
            return false;
        }
    }
    var js = {
            'typeof': function (value) {
                return typeof value;
            },
            'instanceof': function (value, constructor) {
                return value instanceof constructor;
            }
        };
    var print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    var nodeREPL;
    var vm;
    var tokenize;
    var parse;
    var convertAST;
    var validateAST;
    var escodegen;
    var main;
    nodeREPL = require('repl');
    vm = require('vm');
    tokenize = require('../main-tokenizer');
    parse = require('../tdop-parser');
    convertAST = require('../ast-converter');
    validateAST = require('ast-validator');
    escodegen = require('escodegen');
    main = function main() {
        var options;
        var repl;
        options = {
            'prompt': 'sonata> ',
            'useGlobal': true,
            'eval': function (wrappedInput, context, filename, callback) {
                var self;
                self = this;
                return tryCatch(function () {
                    var input;
                    var tokens;
                    var sonataAST;
                    input = wrappedInput.slice(1, -2);
                    tokens = tokenize(input);
                    sonataAST = parse(tokens);
                    return convertAST.convertPartial(sonataAST, function (jsAST) {
                        return tryCatch(function () {
                            var js;
                            validateAST(jsAST);
                            js = escodegen.generate(jsAST);
                            return callback(null, vm.runInThisContext(js, filename));
                        }, function (e) {
                            return callback(e);
                        });
                    });
                }, function (e) {
                    return callback(e);
                });
            }
        };
        repl = nodeREPL.start(options);
        return convertAST.prelude(function (preludeAST) {
            var js;
            js = escodegen.generate(preludeAST);
            return vm.runInThisContext(js, 'prelude');
        });
    };
    $sonata_startMain();
}());