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

	function repeat(func) {
		var result = {args: []};
		do {
			result = func.apply(null, result.args);
		} while (result instanceof _Continuation);
		return result;
	}

	function _Continuation() {
		this.args = arguments;
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