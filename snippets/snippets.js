prelude: {
	"use strict";
	var _Immutable = require("immutable"),
		Sequence = _Immutable.Sequence,
		Vector = _Immutable.Vector,
		IndexedSequence = Sequence(1).concat(1).constructor,
		Map = _Immutable.Map,
		OrderedMap = _Immutable.OrderedMap,
		Range = _Immutable.Range,
		Repeat = _Immutable.Repeat,
		Record = _Immutable.Record,
		Set = _Immutable.Set,
		eq = _Immutable.is;

	var sqrt = Math.sqrt,
		floor = Math.floor,
		ceil = Math.ceil,
		round = Math.round,
		max = Math.max,
		min = Math.min,
		random = Math.random;

	function tryCatch(tryBody, catchBody) {
		try {
			return tryBody();
		}
		catch (e) {
			return catchBody(e);
		}
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

	/*
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
	*/

	// WITH CONTROLLERS

	// The simplest possible "with" controller
	function applied(value, rest) {
		return rest(value);
	}

	// logical with controller
	function predicate(value, next) {
		return value ? next(value) : false;
	}

	function findWhere(value, rest) {
		if (!value) return false;
		if (_ofType(value, Sequence)) {
			return value.find(function (condidate) {
				return rest(condidate);
			});
		}
		return rest(value);
	}
	
	function findAllWhere(value, rest) {
		if (!value) return Vector();
		if (_ofType(value, Sequence)) {
			return value.reduce(function (all, condidate) {
				return all.concat(rest(condidate));
			}, Vector());
		}
		return rest(value);
	}

	// ------------------------------------------------------

	function ensure(predicateResult, msg) {
		if (!predicateResult) {
			throw Error(msg || "ensure failed");
		}
		return true;
	}

	/*
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
	*/

	function Struct() {}

	Struct.clone = function (structure) {
		var newStruct = new structure.constructor();
		for (var property in structure) {
			newStruct[property] = structure[property];
		}
		return newStruct;
	}

	Struct.prototype = Object.create(Object.prototype, {
		get: {
			value: function (property) {
				return this[property];
			}
		},
		set: {
			value: function (changed, newValue) {
				var property, newStruct = Struct.clone(this);
				if (arguments.length > 1) {
					newStruct[changed] = newValue;
				}
				else {
					for (property in changed) {
						newStruct[property] = changed[property];
					}
				}
				return newStruct;
			}
		},
		update: {
			value: function (changed, updater) {
				if (arguments.length > 1) {
					return this.set(changed, 
						updater(this[changed], changed, this));
				}
				else {
					var newStruct = Struct.clone(this);
					for (var property in changed) {
						newStruct[property] = 
							changed[property](this[property], property, this);
					}
					return newStruct;
				}
			}
		},
	});

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
				if (typeof(type) === "function") {
					return x instanceof type;
				}
				return false;
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

	var bitwise = {
		or: function (a, b) {
			return a | b;
		},
		and: function (a, b) {
			return a & b;
		},
		xor: function (a, b) {
			return a ^ b;
		},
		not: function (a) {
			return ~ a;
		},
		leftShift: function (a, b) {
			return a << b;
		},
		rightShift: function (a, b) {
			return a >> b;
		},
		rightShiftZF: function (a, b) {
			return a >>> b;
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
	$paramName = Vector.from(_restArray);
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

concatMany: {
	$first.concat($each_rest);
}

staticProperty: {
	$object.$property;
}

dynamicProperty: {
	$object[$property];
}

toArray: {
	$object.toArray();
}

apply: {
	$func.apply(null, $argsArray);
}

ofType: {
	_ofType($left, $right);
}

ifExpression: {
	$test ? $consequent : $alternate;
}

functionWrapper: {
	(function ($each_parameters) {
		$each_statements;
	})($each_arguments);
}

throwExpression: {
	(function () {
		throw $error;
	})();
}

throwStatement: {
	throw $error;
}

typeExpression: {
	(function () {
		function $typeName($each_params) {
			if (!(this instanceof $typeName))
				return new $typeName($each_params);
			$each_assignments;
		}
		Object.defineProperties($typeName, {
			$each_staticMethods: _
		});
		$typeName.prototype = Object.create(Struct.prototype, {
			constructor: {
				value: $typeName,
			},
			$each_properties: _
		});
		return $typeName;
	})();
}

typeDeclaration: {
	var $typeName = $typeExpression;
}

typeParamAssignment: {
	this.$param = $param;
}

typeProperty: {
	({$key: {
		value: $value
	}});
}

assign: {
	$left = $right;
}

withBlock: {
	$controller($expression, function ($each_parameters) {
		return $rest;
	});
}

selfNameAssignment: {
	var $selfName = this;
}

patternAssign: {
	var $tempVar = $input;
	if ($condition) {
		$each_assignments;
	}
	else throw new Error("failed to match pattern");
}

patternAssignExpression: {
	(function ($tempVar) {
		if ($condition) {
			$each_assignments;
			return $tempVar;
		}
		else throw new Error("failed to match pattern");
	})($input);
}