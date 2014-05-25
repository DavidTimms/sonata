var baseObject = Object.create(null, {
	type: {
		value: "Object"
	},
	toString: {
		value: function () {
			return "{" + this.type + "}";
		}
	}
});

var mix = function (parent, child) {
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

var addKey = function(parent, newKey, newValue) {
	var obj = {}, key;
	for (key in parent) {
		obj[key] = parent[key];
	}
	obj[newKey] = newValue;
	return obj;
}

var type = function (val) {
	return (val === null ? "null" : typeof(val));
}

var contains = function (collection, value) {
	if (typeof(collection) === "function" && collection.count) {
		for (var i = 0; i < collection.count; i++) {
			if (list.eq(collection(i), value)) {
				return true;
			}
		}
	}
	else {
		for (var key in collection) {
			if (list.eq(collection[key], value)) {
				return true;
			}
		}
	}
	return false;
}

var repeat = function (func) {
	var result = {args: []};
	do {
		result = func.apply(null, result.args);
	} while (result instanceof $sonata_Continuation);
	return result;
}

var $sonata_Continuation = function () {
	this.args = arguments;
}

var forIn = function (collection, func) {
	var i, t = typeof(collection), resultArray = [];
	switch (t) {
		case "string":
			for (i = 0; i < collection.length; i++) {
				resultArray.push(func(collection.charAt(i), i));
			}
			return resultArray;
		case "object":
			if (typeof(collection.map) === "function") {
				return collection.map(func);
			}
			else {
				var keys = Object.keys(collection);
				for (i = 0; i < keys.length; i++) {
					resultArray.push(func(keys[i], collection[keys[i]]));
				}
				return resultArray;
			}
		case "function":
			return collection.map(func);
	}
}

var print = console.log.bind(console);

var $sonata_startMain = function () {
	if (typeof(main) === "function" && 
			require &&
			require.main &&
			module &&
			require.main === module &&
			process &&
			process.argv instanceof Array) {
		main.apply(null, process.argv.slice(2));
	}
}

var $sonata_arraySlice = (function () {
	var _slice = Array.prototype.slice;
	return function (arrayLike, from, to) {
		return list.fromArray(_slice.call(arrayLike, from, to));
	};
})();