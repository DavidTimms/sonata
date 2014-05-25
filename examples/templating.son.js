(function () {
    'use strict';
    var list = require('texo'), range = list.range, eq = list.eq, mix = function (parent, child) {
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
        }, $sonata_startMain = function () {
            if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
                main.apply(null, process.argv.slice(2));
            }
        }, $sonata_arraySlice = function () {
            var _slice = Array.prototype.slice;
            return function (arrayLike, from, to) {
                return list.fromArray(_slice.call(arrayLike, from, to));
            };
        }();
    var tag, html, head, title, link, script, body, div, h1, select, option, opt, template;
    function tag(tagName) {
        return function (attrs) {
            var hasAttrs, bodyParts, attrString;
            hasAttrs = eq(type(attrs), 'object');
            bodyParts = Array().slice.call(arguments, hasAttrs ? (1) : (0)).join('\n');
            attrString = hasAttrs ? (Object.keys(attrs).map(function (attr) {
                return '' + attr + ('=\'' + (attrs[attr] + '\''));
            }).join(' ')) : ('');
            return '<' + ('' + tagName + (' ' + ('' + attrString + ('>' + ('' + bodyParts + ('</' + (tagName + '>')))))));
        };
    }
    html = tag('html');
    head = tag('head');
    title = tag('title');
    link = tag('link');
    script = tag('script');
    body = tag('body');
    div = tag('div');
    h1 = tag(h1);
    select = tag('select');
    option = tag('option');
    function opt(val) {
        return option({ 'value': val }, val);
    }
    function template(pageTitle) {
        return html(head(title('My Page'), link({
            'rel': 'stylesheet',
            'href': './style.css'
        }), script({ 'src': './client.js' })), body(div({ 'class': 'container' }, pageTitle ? (h1(pageTitle)) : (''), 'Some body text here'), select({ 'name': 'gender' }, opt('male'), opt('female'))));
    }
    print(template('My Generated Page'));
    $sonata_startMain();
}());