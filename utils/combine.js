var list = require("texo");

module.exports = combine;

function combine(/* ...lists... */) {
	var combination;
    if (arguments.length === 1) {
    	var sourceList = arguments[0];
    	combination = function (i) {
    		return list(sourceList(i));
    	};
    	combination.count = sourceList.count;
    	return combination;
    }
    var thisList = arguments[0];
    var childList = combine.apply(null, Array.prototype.slice.call(arguments, 1));
    var count = childList.count;
    combination = function (i) {
    	var head = thisList(Math.floor(i / count));
    	var rest = childList(i % count);
    	return list(head).concat(rest);
    };
    combination.count = count * thisList.count;
    return combination;
}