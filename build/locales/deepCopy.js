function deepCopy(obj) {
	if (!obj || typeof obj != "object") {
		return obj;
	} else {
		var emptyCopy = obj instanceof Array ? [] : Object.create(Object.getPrototypeOf(obj));
		return deepMerge(emptyCopy, obj);
	}
}
function deepMerge(target, obj1 /* plus any number of object arguments */) {
	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];
		if (obj instanceof Array) {
			for (var k in obj) {
				target.push(obj[k]);
			}
		} else {
			for (var k in obj) {
				// hasOwnProperty checking is not needed for our non-OOP stuff
				var value = obj[k];
				if (!value || typeof value != "object") {
					target[k] = value;
				} else if (k in target) {
					deepMerge(target[k], value);
				} else {
					target[k] = deepCopy(value);
				}
			}
		}
	}
	return target;
}
module.exports = deepCopy;