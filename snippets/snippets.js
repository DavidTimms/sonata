prelude: {
	"use strict";
	var list = require("texo");
	var range = list.range;
	var eq = list.eq;

//	var baseObject = Object.create(null, {
//		type: {
//			value: "Object"
//		},
//		toString: {
//			value: function () {
//				return "{" + this.type + "}";
//			}
//		}
//	});

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

	function contains(collection, value) {
		var i, key;
		if (typeof(collection) === "function" && collection.count) {
			for (i = 0; i < collection.count; i++) {
				if (list.eq(collection(i), value)) {
					return true;
				}
			}
		}
		else {
			for (key in collection) {
				if (list.eq(collection[key], value)) {
					return true;
				}
			}
		}
		return false;
	}

	// WITH CONTROLLERS

	// The simplest possible "with" controller
	function applied(value, rest) {
		return rest(value);
	}

	// logical with controller
	function predicate(value, next) {
		return value ? next(value) : false;
	}

	function find(value, rest) {
		var res;
		if (!value) return false;
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
		var all = list(), res;
		if (!value) return all;
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
		return this.items && (this.pointer < this.items.count);
	}
	Iterator.prototype.next = function () {
		return this.items && this.items(this.pointer++);
	}

	function from(a) {
		return new Iterator(a);
	}

	// ------------------------------------------------------

	function ensure(predicateResult, msg) {
		if (!predicateResult) {
			throw Error(msg || "ensure failed");
		}
		return true;
	}

	function forIn(collection, func) {
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

	function _ofType(x, type) {
		switch (typeof x) {
			case "number":
				return type === Number;
			case "string":
				return type === String;
			case "boolean":
				return type === Boolean;
			case "undefined":
				return type === undefined;
			default:
				if (x === null && type === null) return true;
				return typeof(type) === "function" && x instanceof type;
		}
	}

	var js = {
		"typeof": function (value) {
			return typeof(value);
		},
		"instanceof": function (value, constructor) {
			return value instanceof constructor;
		}
	};

	var print = console.log.bind(console);

	function _startMain() {
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
}

startMain: {
	_startMain();
}

restParam: {
	var _i, _restArray = [];
	for (_i = $fromIndex; _i < arguments.length; _i++) {
		_restArray.push(arguments[_i]);
	}
	var $paramName = list.fromArray(_restArray);
}

defaultArgument: {
	if ($argument === undefined) $expression;
}

add: {
	+$left + +$right;
}

concatString: {
	$left + $right;
}

concat: {
	$left.concat($right);
}

staticProperty: {
	$object.$property;
}

dynamicProperty: {
	$object[$property];
}

ifExpression: {
	$test ? $consequent : $alternate;
}

functionWrapper: {
	(function ($each_parameters) {
		$each_statements;
	}($each_arguments));
}

typeExpression: {
	(function $typeName($each_properties) {
		if (!(this instanceof $typeName))
			return new $typeName($each_properties);
		$each_assignments;
	})
}

fullTypeExpression: {
	(function () {
		function $typeName($each_properties) {
			if (!(this instanceof $typeName))
				return new $typeName($each_properties);
			$each_assignments;
		}
		$typeName.prototype = Object.create(_baseObject, {
			constructor: {
				value: $typeName,
			},
			$each: $methods
		});
		return $typeName;
	})();
}

typeDeclaration: {
	function $typeName($each_properties) {
		if (!(this instanceof $typeName))
			return new $typeName($each_properties);
		$each_assignments;
	}
}

typePropertyAssignment: {
	this.$property = $property;
}

assign: {
	$left = $right;
}

withBlock: {
	$controller($expression, function ($each_parameters) {
		return $rest;
	});
}