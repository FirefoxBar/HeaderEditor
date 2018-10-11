import browser from 'webextension-polyfill';
import utils from './utils';
import merge from 'merge';
import equal from 'fast-deep-equal';

function getDatabase() {
	return new Promise((resolve, reject) => {
		const dbOpenRequest = window.indexedDB.open("headereditor", 2);
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
				for (const t of utils.TABLE_NAMES) {
					event.target.result.createObjectStore(t, {keyPath: 'id', autoIncrement: true});
				}
			} else {
				utils.TABLE_NAMES.forEach(k => {
					const tx = event.target.result.transaction([k], "readwrite");
					const os = tx.objectStore(k);
					os.openCursor().onsuccess = function(e) {
						const cursor = e.target.result;
						if (cursor) {
							const s = cursor.value;
							s.id = cursor.key;
							// upgrade rule format
							os.put(utils.upgradeRuleFormat(s));
							cursor.continue();
						} else {
							updateCache(k);
						}
					};
				})
			}
		}
	});
};

const prefs = browser.extension.getBackgroundPage().prefs || new function Prefs() {
	function defineReadonlyProperty(obj, key, value) {
		const copy = merge(true, value);
		// In ES6, freezing a literal is OK (it returns the same value), but in previous versions it's an exception.
		if (typeof copy == "object") {
			Object.freeze(copy);
		}
		Object.defineProperty(obj, key, {value: copy, configurable: true})
	}

	const _this = this;
	let boundWrappers = {};
	let boundMethods = {};

	let defaults = {
		"add-hot-link": false,
		"manage-collapse-group": true, // Collapse groups
		"exclude-he": true // rules take no effect on HE or not
	};
	// when browser is strarting up, the setting is default
	this.isDefault = true;

	let values = merge(true, defaults);
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
		console.warn('No default preference for ' + key);
	};

	Prefs.prototype.getAll = function(key) {
		return merge(true, values);
	};

	Prefs.prototype.set = function(key, value, options) {
		let oldValue = merge(true, values[key]);
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
		for (const key in defaults) {
			if (synced && (key in synced)) {
				_this.set(key, synced[key], {noSync: true});
			} else {
				const value = tryMigrating(key);
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
		const value = localStorage[key];
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

export default { getSync, getDatabase, getLocalStorage, prefs };