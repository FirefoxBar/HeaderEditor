function getDatabase() {
	return new Promise((resolve, reject) => {
		let dbOpenRequest = window.indexedDB.open("headereditor", 2);
		dbOpenRequest.onsuccess = function(e) {
			resolve(e.target.result);
		};
		dbOpenRequest.onerror = function(event) {
			console.log(event);
			reject(event);
		};
		dbOpenRequest.onupgradeneeded = function(event) {
			if (event.oldVersion == 0) {
				// Installed
				for (let t of tableNames) {
					event.target.result.createObjectStore(t, {keyPath: 'id', autoIncrement: true});
				}
			} else {
				if (event.oldVersion < 2) {
					upgradeTo2();
				}
			}
		}
	});
};

function runTryCatch(func) {
	try {
		return func();
	} catch(e) {}
}

var cachedRules = {};
for (let t of tableNames) {
	cachedRules[t] = null;
}
function getRules(type, options) {
	return options ? filterRules(cachedRules[type], options) : cachedRules[type];
}

function updateCache(type) {
	return new Promise((resolve, reject) => {
		getDatabase().then((db) => {
			var tx = db.transaction([type], "readonly");
			var os = tx.objectStore(type);
			var all = [];
			os.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					let s = cursor.value;
					let isValidRule = true;
					s.id = cursor.key;
					// Init function here
					if (s.isFunction) {
						try {
							s._func = new Function('val', 'detail', s.code);
						} catch (e) {
							isValidRule = false;
						}
					}
					// Init regexp
					if (s.matchType === 'regexp') {
						try {
							s._reg = new RegExp(s.pattern, 'g');
						} catch (e) {
							isValidRule = false;
						}
					}
					if (typeof(s.exclude) === 'string' && s.exclude.length > 0) {
						try {
							s._exclude = new RegExp(s.exclude);
						} catch (e) {
							isValidRule = false;
						}
					}
					if (isValidRule) {
						all.push(s);
					}
					cursor.continue();
				} else {
					cachedRules[type] = all;
					resolve();
				}
			};
		}).catch(reject);
	});
}

function filterRules(rules, options) {
	if (options === null || typeof(options) !== 'object') {
		return rules;
	}
	var url = typeof(options.url) !== 'undefined' ? options.url: null;
	var id = typeof(options.id) !== 'undefined' ? Number(options.id) : null;

	if (id != null) {
		rules = rules.filter((rule) => {
			return rule.id == id;
		});
	}

	if (options.name) {
		rules = rules.filter((rule) => {
			return rule.name === options.name;
		});
	}

	if (typeof(options.enable) !== 'undefined') {
		rules = rules.filter((rule) => {
			return rule.enable == options.enable;
		});
	}

	if (url != null) {
		rules = rules.filter((rule) => {
			let result = false;
			switch (rule.matchType) {
				case 'all':
					result = true;
					break;
				case 'regexp':
					rule._reg.lastIndex = 0;
					result = rule._reg.test(url);
					break;
				case 'prefix':
					result = url.indexOf(rule.pattern) === 0;
					break;
				case 'domain':
					result = getDomain(url) === rule.pattern;
					break;
				case 'url':
					result = url === rule.pattern;
					break;
				default:
					break;
			}
			if (result && rule._exclude) {
				return !(rule._exclude.test(url));
			} else {
				return result;
			}
		});
	}
	return rules;
}

function saveRule(tableName, o) {
	return new Promise((resolve) => {
		getDatabase().then((db) => {
			var tx = db.transaction([tableName], "readwrite");
			var os = tx.objectStore(tableName);
			// Update
			if (o.id) {
				var request = os.get(Number(o.id));
				request.onsuccess = function(event) {
					var rule = request.result || {};
					for (var prop in o) {
						if (prop == "id") {
							continue;
						}
						rule[prop] = o[prop];
					}
					request = os.put(rule);
					request.onsuccess = function(event) {
						updateCache(tableName);
						resolve(rule);
					};
				};
				return;
			}
			// Check base informations
			upgradeRuleFormat(o);
			// Create
			// Make sure it's not null - that makes indexeddb sad
			delete o["id"];
			var request = os.add(o);
			request.onsuccess = function(event) {
				updateCache(tableName);
				// Give it the ID that was generated
				o.id = event.target.result;
				resolve(o);
			};
		});
	});
}

function deleteRule(tableName, id) {
	return new Promise((resolve) => {
		getDatabase().then((db) => {
			var tx = db.transaction([tableName], "readwrite");
			var os = tx.objectStore(tableName);
			var request = os.delete(Number(id));
			request.onsuccess = function(event) {
				updateCache(tableName);
				resolve();
			};
		});
	});
}


function getType(o) {
	if (typeof o == "undefined" || typeof o == "string") {
		return typeof o;
	}
	if (o instanceof Array) {
		return "array";
	}
	throw "Not supported - " + o;
}


// Accepts an array of pref names (values are fetched via prefs.get)
// and establishes a two-way connection between the document elements and the actual prefs
function notifyBackground(request) {
	return new Promise((resolve) => {
		browser.runtime.sendMessage(shallowMerge({}, request, {
			method: "notifyBackground",
			reason: request.method
		})).then(resolve);
	});
}
function isCheckbox(el) {
	return el.nodeName.toLowerCase() == "input" && "checkbox" == el.type.toLowerCase();
}
function setupLivePrefs(IDs) {
	var localIDs = {};
	IDs.forEach(function(id) {
		localIDs[id] = true;
		updateElement(id).addEventListener("change", function() {
			notifyBackground({"method": "prefChanged", "prefName": this.id, "value": isCheckbox(this) ? this.checked : this.value});
			prefs.set(this.id, isCheckbox(this) ? this.checked : this.value);
		});
	});
	browser.runtime.onMessage.addListener(function(request) {
		if (request.prefName in localIDs) {
			updateElement(request.prefName);
		}
	});
	function updateElement(id) {
		var el = document.getElementById(id);
		el[isCheckbox(el) ? "checked" : "value"] = prefs.get(id);
		el.dispatchEvent(new Event("change", {bubbles: true, cancelable: true}));
		return el;
	}
}

var prefs = browser.extension.getBackgroundPage().prefs || new function Prefs() {
	const _this = this;
	let boundWrappers = {};
	let boundMethods = {};

	let defaults = {
		"manage-hide-empty": false, // Hide empty groups
		"manage-collapse-group": true, // Collapse groups
		"add-hot-link": true,
		"exclude-he": true // rules take no effect on HE or not
	};
	// when browser is strarting up, the setting is default
	this.isDefault = true;

	let values = deepCopy(defaults);
	let syncTimeout; // see broadcast() function below

	Object.defineProperty(this, "readOnlyValues", {value: {}});

	Prefs.prototype.get = function(key, defaultValue) {
		if (key in boundMethods) {
			if (key in boundWrappers) {
				return boundWrappers[key];
			} else {
				if (key in values) {
					boundWrappers[key] = boundMethods[key](values[key]);
					return boundWrappers[key];
				}
			}
		}
		if (key in values) {
			return values[key];
		}
		if (defaultValue !== undefined) {
			return defaultValue;
		}
		if (key in defaults) {
			return defaults[key];
		}
		console.warn("No default preference for '%s'", key);
	};

	Prefs.prototype.getAll = function(key) {
		return deepCopy(values);
	};

	Prefs.prototype.set = function(key, value, options) {
		let oldValue = deepCopy(values[key]);
		values[key] = value;
		defineReadonlyProperty(this.readOnlyValues, key, value);
		if ((!options || !options.noBroadcast) && !equal(value, oldValue)) {
			_this.broadcast(key, value, options);
		}
	};

	Prefs.prototype.bindAPI = function(apiName, apiMethod) {
		boundMethods[apiName] = apiMethod;
	};

	Prefs.prototype.remove = function(key) {
		_this.set(key, undefined)
	};

	Prefs.prototype.broadcast = function(key, value, options) {
		if (!options || !options.noSync) {
			clearTimeout(syncTimeout);
			syncTimeout = setTimeout(function() {
				getSync().set({"settings": values});
			}, 0);
		}
	};

	Object.keys(defaults).forEach(function(key) {
		_this.set(key, defaults[key], {noBroadcast: true});
	});

	getSync().get("settings").then(function(result) {
		_this.isDefault = false;
		const synced = result.settings;
		for (var key in defaults) {
			if (synced && (key in synced)) {
				_this.set(key, synced[key], {noSync: true});
			} else {
				var value = tryMigrating(key);
				if (value !== undefined) {
					_this.set(key, value);
				}
			}
		}
	});

	browser.storage.onChanged.addListener(function(changes, area) {
		if (area == "sync" && "settings" in changes) {
			const synced = changes.settings.newValue;
			if (synced) {
				for (key in defaults) {
					if (key in synced) {
						_this.set(key, synced[key], {noSync: true});
					}
				}
			} else {
				// user manually deleted our settings, we'll recreate them
				getSync().set({"settings": values});
			}
		}
	});

	function tryMigrating(key) {
		if (!(key in localStorage)) {
			return undefined;
		}
		var value = localStorage[key];
		delete localStorage[key];
		localStorage["DEPRECATED: " + key] = value;
		switch (typeof defaults[key]) {
			case "boolean":
				return value.toLowerCase() === "true";
			case "number":
				return Number(value);
			case "object":
				try {
					return JSON.parse(value);
				} catch(e) {
					console.log("Cannot migrate from localStorage %s = '%s': %o", key, value, e);
					return undefined;
				}
		}
		return value;
	}
};

function deepCopy(obj) {
	if (!obj || typeof obj != "object") {
		return obj;
	} else {
		if (obj instanceof Array) {
			var emptyCopy = [];
			return deepMerge(emptyCopy, obj);
		} else {
			var emptyCopy = Object.create(Object.getPrototypeOf(obj));
			return deepMerge(emptyCopy, obj);
		}
	}
}

function deepMerge(target, obj1 /* plus any number of object arguments */) {
	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];
		if (obj instanceof Array) {
			for (var k = 0; k < obj.length; k++) {
				var value = obj[k];
				console.log(value);
				console.log(typeof(value));
				if (!value || typeof value != "object") {
					target.push(value);
				} else {
					target.push(deepCopy(value));
				}
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

function shallowMerge(target, obj1 /* plus any number of object arguments */) {
	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];
		for (var k in obj) {
			target[k] = obj[k];
			// hasOwnProperty checking is not needed for our non-OOP stuff
		}
	}
	return target;
}

function equal(a, b) {
	if (!a || !b || typeof a != "object" || typeof b != "object") {
		return a === b;
	}
	if (Object.keys(a).length != Object.keys(b).length) {
		return false;
	}
	for (var k in a) {
		if (a[k] !== b[k]) {
			return false;
		}
	}
	return true;
}

function defineReadonlyProperty(obj, key, value) {
	var copy = deepCopy(value);
	// In ES6, freezing a literal is OK (it returns the same value), but in previous versions it's an exception.
	if (typeof copy == "object") {
		Object.freeze(copy);
	}
	Object.defineProperty(obj, key, {value: copy, configurable: true})
}

function getSync() {
	if ("sync" in browser.storage) {
		return browser.storage.sync;
	}
	// In old Firefox version, sync is not supported, use local to instead of it
	if ("local" in browser.storage) {
		return browser.storage.local;
	}
}
function getLocalStorage() {
	return browser.storage.local;
}



function upgradeTo2() {
	for (let k of tableNames) {
		getDatabase().then((db) => {
			let tx = db.transaction([k], "readwrite");
			let os = tx.objectStore(k);
			os.openCursor().onsuccess = function(e) {
				let cursor = e.target.result;
				if (cursor) {
					let s = cursor.value;
					s.id = cursor.key;
					os.put(upgradeRuleFormat(s));
					cursor.continue();
				} else {
					updateCache(k);
				}
			};
		});
	}
}

function upgradeRuleFormat(s) {
	if (typeof(s.matchType) === "undefined") {
		s.matchType = s.type;
		delete s.type;
	}
	if (typeof(s.isFunction) === "undefined") {
		s.isFunction = 0;
	}
	if (typeof(s.enable) === "undefined") {
		s.enable = 1;
	}
	return s;
}

function initStorage() {
	setTimeout(() => {
		let queue = [];
		if (cachedRules.request === null) {
			queue.push(updateCache('request'));
		}
		if (cachedRules.sendHeader === null) {
			queue.push(updateCache('sendHeader'));
		}
		if (cachedRules.receiveHeader === null) {
			queue.push(updateCache('receiveHeader'));
		}
		Promise.all(queue).then(() => {
			if (cachedRules.request === null || cachedRules.sendHeader === null || cachedRules.receiveHeader === null) {
				initStorage();
			}
		});
	}, 100);
}
initStorage();