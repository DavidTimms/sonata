var jsonpretty = require('jsonpretty');

function printObj (obj) {
	console.log(jsonpretty(obj));
	return obj;
}

module.exports = printObj;