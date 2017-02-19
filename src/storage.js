function getDatabase(ready, error) {
	var dbOpenRequest = window.indexedDB.open("headereditor", 1);
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
		}
	}
};

var cachedRules = {
	"request": null,
	"sendHeader": null,
	"receiveHeader": null
};
function getRules(type, options) {
	return new Promise(function(resolve) {
		if (cachedRules[type] != null) {
			resolve(filterRules(cachedRules[type], options));
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
					all.push(cursor.value);
					cursor.continue();
				} else {
					cachedRules[type] = all;
					resolve(filterRules(all, options));
				}
			};
		}, null);
	});
}


function invalidateCache(andNotify) {
	cachedStyles = {
		"request": null,
		"sendHeader": null,
		"receiveHeader": null
	};
}

function filterRules(rules, options) {
	var url = "url" in options ? options.url: null;
	var id = "id" in options ? Number(options.id) : null;

	if (id != null) {
		rules = rules.filter(function(rule) {
			return rule.id == id;
		});
	}
	if (url != null) {
		rules = rules.filter(function(rule) {
			if (rule.type === 'regexp') {
				var reg = new RegExp(rule.pattern);
				return reg.test(url);
			} else if (rule.type === 'prefix') {
				return url.indexOf(rule.pattern) >= 0;
			} else if (rule.type === 'domain') {
				return getDomain(url) === rule.pattern;
			}
		});
	}
	return rules;
}

function saveRule(o, callback) {
	var tableName = o.saveType;
	delete o["method"];
	delete o["saveType"];
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
					invalidateCache(true);
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
			invalidateCache(true);
			// Give it the ID that was generated
			o.id = event.target.result;
			if (callback) {
				callback(o);
			}
		};
	});
}

function deleteRule(id) {
	var tableName = o.saveType;
	return new Promise(function(resolve){
		getDatabase(function(db) {
			var tx = db.transaction([saveType], "readwrite");
			var os = tx.objectStore(saveType);
			var request = os.delete(Number(id));
			request.onsuccess = function(event) {
				invalidateCache(true);
				resolve();
			};
		});
	});
}

function getDomain(url) {
	if (url.indexOf("file:") == 0) {
		return [];
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
