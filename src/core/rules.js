import utils from './utils';
import storage from './storage';
import merge from 'merge';

const cache = {};
utils.TABLE_NAMES.forEach(t => cache[t] = null);

function updateCache(type) {
	return new Promise((resolve, reject) => {
		storage.getDatabase().then((db) => {
			const tx = db.transaction([type], "readonly");
			const os = tx.objectStore(type);
			const all = [];
			os.openCursor().onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor) {
					const s = cursor.value;
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
					cache[type] = all;
					resolve();
				}
			};
		}).catch(reject);
	});
}

function filter(rules, options) {
	if (options === null || typeof(options) !== 'object') {
		return rules;
	}
	const url = typeof(options.url) !== 'undefined' ? options.url: null;
	const id = typeof(options.id) !== 'undefined' ? Number(options.id) : null;

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
					result = utils.getDomain(url) === rule.pattern;
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

function save(tableName, o) {
	delete o["_v_key"];
	delete o["_func"];
	delete o["_reg"];
	return new Promise(resolve => {
		storage.getDatabase().then((db) => {
			const tx = db.transaction([tableName], "readwrite");
			const os = tx.objectStore(tableName);
			// Update
			if (o.id) {
				const request = os.get(Number(o.id));
				request.onsuccess = function(event) {
					const rule = request.result || {};
					for (const prop in o) {
						if (prop == "id") {
							continue;
						}
						rule[prop] = o[prop];
					}
					const req = os.put(rule);
					req.onsuccess = function(event) {
						updateCache(tableName);
						resolve(rule);
					};
				};
				return;
			}
			// Check base informations
			utils.upgradeRuleFormat(o);
			// Create
			// Make sure it's not null - that makes indexeddb sad
			delete o["id"];
			const request = os.add(o);
			request.onsuccess = function(event) {
				updateCache(tableName);
				// Give it the ID that was generated
				o.id = event.target.result;
				resolve(o);
			};
		});
	});
}

function remove(tableName, id) {
	return new Promise((resolve) => {
		storage.getDatabase().then((db) => {
			const tx = db.transaction([tableName], "readwrite");
			const os = tx.objectStore(tableName);
			const request = os.delete(Number(id));
			request.onsuccess = function(event) {
				updateCache(tableName);
				resolve();
			};
		});
	});
}

function get(type, options) {
	// When browser is starting up, pass all requests
	return cache[type] ? (options ? filter(cache[type], options) : cache[type]) : null;
}

function createExport(arr) {
	const result = {};
	for (const k in arr) {
		result[k] = [];
		arr[k].forEach(e => {
			const copy = merge(true, e);
			delete copy["id"];
			delete copy["_reg"];
			delete copy["_func"];
			delete copy["_v_key"];
			result[k].push(copy);
		});
	}
	return result;
}

function fromJson(str) {
	const list = JSON.parse(str);
	utils.TABLE_NAMES.forEach(e => {
		if (list[e]) {
			list[e].map(ee => {
				delete ee.id;
				return utils.upgradeRuleFormat(ee);
			});
		}
	});
	return list;
}

function init() {
	setTimeout(() => {
		const queue = [];
		if (cache.request === null) {
			queue.push(updateCache('request'));
		}
		if (cache.sendHeader === null) {
			queue.push(updateCache('sendHeader'));
		}
		if (cache.receiveHeader === null) {
			queue.push(updateCache('receiveHeader'));
		}
		Promise.all(queue).then(() => {
			if (cache.request === null || cache.sendHeader === null || cache.receiveHeader === null) {
				init();
			}
		});
	}, 100);
}
init();

export default {
	get,
	filter,
	save,
	remove,
	updateCache,
	createExport,
	fromJson
}