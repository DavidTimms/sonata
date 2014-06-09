(function () {
    'use strict';
    var list;
    var range;
    var eq;
    var js;
    var print;
    var tag;
    var html;
    var head;
    var title;
    var link;
    var script;
    var body;
    var div;
    var h1;
    var select;
    var option;
    var opt;
    var template;
    list = require('texo');
    range = list.range;
    eq = list.eq;
    function mix(parent, child) {
        var key;
        var obj;
        obj = {};
        for (key in parent) {
            obj[key] = parent[key];
        }
        for (key in child) {
            obj[key] = child[key];
        }
        return obj;
    }
    function addKey(parent, newKey, newValue) {
        var obj;
        var key;
        obj = {}, key = undefined;
        for (key in parent) {
            obj[key] = parent[key];
        }
        obj[newKey] = newValue;
        return obj;
    }
    function contains(collection, value) {
        var i;
        var key;
        if (typeof collection === 'function' && collection.count) {
            for (i = 0; i < collection.count; i++) {
                if (list.eq(collection(i), value)) {
                    return true;
                }
            }
        } else {
            for (key in collection) {
                if (list.eq(collection[key], value)) {
                    return true;
                }
            }
        }
        return false;
    }
    function applied(value, rest) {
        return rest(value);
    }
    function predicate(value, next) {
        if (value)
            return next(value);
        else
            return false;
    }
    function find(value, rest) {
        var res;
        if (!value)
            return false;
        if (value instanceof Iterator) {
            while (value.hasNext()) {
                if (res = rest(value.next())) {
                    return res;
                }
            }
            return false;
        }
        return rest(value);
    }
    function findAll(value, rest) {
        var all;
        var res;
        all = list(), res = undefined;
        if (!value)
            return all;
        if (value instanceof Iterator) {
            while (value.hasNext()) {
                if (res = rest(value.next())) {
                    all = all.concat(res);
                }
            }
            return all;
        }
        return rest(value);
    }
    function Iterator(l) {
        this.items = l;
        this.pointer = 0;
    }
    Iterator.prototype.hasNext = function () {
        return this.items && this.pointer < this.items.count;
    };
    Iterator.prototype.next = function () {
        return this.items && this.items(this.pointer++);
    };
    function from(a) {
        return new Iterator(a);
    }
    function ensure(predicateResult, msg) {
        if (!predicateResult) {
            throw Error(msg || 'ensure failed');
        }
        return true;
    }
    function forIn(collection, func) {
        var i;
        var t;
        var resultArray;
        var keys;
        i = undefined, t = typeof collection, resultArray = [];
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
                keys = Object.keys(collection);
                for (i = 0; i < keys.length; i++) {
                    resultArray.push(func(keys[i], collection[keys[i]]));
                }
                return resultArray;
            }
        case 'function':
            return collection.map(func);
        }
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
            return typeof type === 'function' && x instanceof type;
        }
    }
    js = {
        'typeof': function (value) {
            return typeof value;
        },
        'instanceof': function (value, constructor) {
            return value instanceof constructor;
        }
    };
    print = console.log.bind(console);
    function $sonata_startMain() {
        if (typeof main === 'function' && require && require.main && module && require.main === module && process && process.argv instanceof Array) {
            main.apply(null, process.argv.slice(2));
        }
    }
    tag = undefined, html = undefined, head = undefined, title = undefined, link = undefined, script = undefined, body = undefined, div = undefined, h1 = undefined, select = undefined, option = undefined, opt = undefined, template = undefined;
    tag = function tag(tagName) {
        return function (attrs) {
            var hasAttrs;
            var bodyParts;
            var attrString;
            hasAttrs = $sonata_ofType(attrs, Object);
            bodyParts = Array().slice.call(arguments, hasAttrs ? 1 : 0).join('\n');
            attrString = hasAttrs ? Object.keys(attrs).map(function (attr) {
                return attr + ('=\'' + (attrs[attr] + '\''));
            }).join(' ') : '';
            return '<' + (tagName + (' ' + (attrString + ('>' + (bodyParts + ('</' + (tagName + '>')))))));
        };
    };
    html = tag('html');
    head = tag('head');
    title = tag('title');
    link = tag('link');
    script = tag('script');
    body = tag('body');
    div = tag('div');
    h1 = tag('h1');
    select = tag('select');
    option = tag('option');
    opt = function opt(val) {
        return option({ 'value': val }, val);
    };
    template = function template(pageTitle) {
        return html(head(title('My Page'), link({
            'rel': 'stylesheet',
            'href': './style.css'
        }), script({ 'src': './client.js' })), body(div({ 'class': 'container' }, pageTitle ? h1(pageTitle) : '', 'Some body text here'), select({ 'name': 'gender' }, opt('male'), opt('female'))));
    };
    print(template('My Generated Page'));
    $sonata_startMain();
}());