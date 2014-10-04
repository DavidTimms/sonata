
function bareObject(properties) {
	var obj = Object.create(null);
	Object.keys(properties).forEach(function (key) {
		obj[key] = properties[key];
	});
	return obj;
}

var varGen = 0;
function generateVarName() {
	return "$sonata_var" + varGen++;
}

module.exports = {
	bareObject: bareObject,
	generateVarName: generateVarName,
};