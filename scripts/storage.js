function getDatabase(ready, error) {
	var dbOpenRequest = window.indexedDB.open("headereditor", 2);
	dbOpenRequest.onsuccess = function(e) {
		ready(e.target.result);
	};
	dbOpenRequest.onerror = function(event) {
		console.log(event);
		if (error) {
			error(event);
		}
	};
	dbOpenRequest.onupgradeneeded = function(event) {
		if (event.oldVersion == 0) {
			// Installed
			event.target.result.createObjectStore("request", {keyPath: 'id', autoIncrement: true});
			event.target.result.createObjectStore("sendHeader", {keyPath: 'id', autoIncrement: true});
			event.target.result.createObjectStore("receiveHeader", {keyPath: 'id', autoIncrement: true});
		} else {
			if (event.oldVersion < 2) {
				upgradeTo2();
			}
		}
	}
};

function runTryCatch(func) {
	try { return func() }
	catch(e) {}
}

var cachedRules = {
	"request": null,
	"sendHeader": null,
	"receiveHeader": null
};
function getRules(type, options, callback) {
	if (cachedRules[type] != null) {
		callback(filterRules(cachedRules[type], options));
		return;
	}
	getDatabase(function(db) {
		var tx = db.transaction([type], "readonly");
		var os = tx.objectStore(type);
		var all = [];
		os.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				var s = cursor.value;
				s.id = cursor.key;
				// Init function here
				if (s.isFunction) {
					s.func_body = new Function('val', s.code);
				}
				all.push(s);
				cursor.continue();
			} else {
				cachedRules[type] = all;
				callback(filterRules(all, options));
			}
		};
	}, null);
}


function invalidateCache(type) {
	cachedRules[type] = null;
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
			rule.name === options.name;
		});
	}

	if (url != null) {
		rules = rules.filter((rule) => {
			var result = false;
			if (rule.matchType === 'all') {
				result = true;
			} else if (rule.matchType === 'regexp') {
				var r = runTryCatch(function() {
					var reg = new RegExp(rule.pattern);
					return reg.test(url);
				});
				result =  (r === undefined ? false : r);
			} else if (rule.matchType === 'prefix') {
				result = url.indexOf(rule.pattern) === 0;
			} else if (rule.matchType === 'domain') {
				result = getDomain(url) === rule.pattern;
			} else if (rule.matchType === 'url') {
				result = url === rule.pattern;
			} else {
				result = false;
			}
			if (result && typeof(rule.exclude) === 'string' && rule.exclude.length > 0) {
				var r = runTryCatch(function() {
					var reg = new RegExp(rule.exclude);
					return reg.test(url);
				});
				return (typeof(r) === 'undefined' || r) ? false : true;
			} else {
				return result;
			}
		});
	}
	return rules;
}

function saveRule(tableName, o, callback) {
	getDatabase(function(db) {
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
					invalidateCache(tableName);
					if (callback) {
						callback(rule);
					}
				};
			};
			return;
		}
		// Create
		// Make sure it's not null - that makes indexeddb sad
		delete o["id"];
		var request = os.add(o);
		request.onsuccess = function(event) {
			invalidateCache(tableName);
			// Give it the ID that was generated
			o.id = event.target.result;
			if (callback) {
				callback(o);
			}
		};
	});
}

function deleteRule(tableName, id, callback) {
	getDatabase(function(db) {
		var tx = db.transaction([tableName], "readwrite");
		var os = tx.objectStore(tableName);
		var request = os.delete(Number(id));
		request.onsuccess = function(event) {
			invalidateCache(tableName);
			callback();
		};
	});
}

function getDomain(url) {
	if (url.indexOf("file:") == 0) {
		return '';
	}
	var d = /.*?:\/*([^\/:]+)/.exec(url)[1];
	return d;
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


function upgradeTo2() {
	for (let k of ["request", "sendHeader", "receiveHeader"]) {
		getDatabase((db) => {
			let tx = db.transaction(["headereditor"], "readwrite");
			let os = tx.objectStore(k);
			os.openCursor().onsuccess = function(e) {
				let cursor = e.target.result;
				if (cursor) {
					let s = cursor.value;
					s.id = cursor.key;
					s.matchType = s.type;
					delete s.type;
					s.isFunction = 0;
					os.put(s);
					cursor.continue();
				}
			};
		});
	}
}