import utils from './utils'
import storage from './storage'

function getTotalCount(rules) {
	let count = 0;
	utils.TABLE_NAMES.forEach(e => count += rules[e].length);
	return count;
}

export default {
	save(rules) {
		return new Promise((resolve, reject) => {
			if (utils.IS_CHROME) {
				const que = [];
				// split
				const limit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 500;
				let index = 0;
				while (getTotalCount(rules) > 0) {
					const one = {};
					utils.TABLE_NAMES.forEach(e => {
						one[e] = []
					});
					let t = 0;
					let toPut = null;
					while (JSON.stringify(one).length < limit) {
						// find avaliable
						while (utils.TABLE_NAMES[t] && rules[utils.TABLE_NAMES[t]].length === 0) {
							t++;
						}
						if (!utils.TABLE_NAMES[t]) {
							break;
						}
						toPut = rules[utils.TABLE_NAMES[t]].splice(0, 1)[0];
						one[utils.TABLE_NAMES[t]].push(toPut);
					}
					if (utils.TABLE_NAMES[t]) {
						rules[utils.TABLE_NAMES[t]].push(toPut);
						one[utils.TABLE_NAMES[t]].splice(one[utils.TABLE_NAMES[t]].indexOf(toPut), 1);
					}
					const saveOne = {};
					saveOne["backup_" + (index++)] = one;
					que.push(storage.getSync().set(saveOne));
				}
				que.push(storage.getSync().set({
					backup: {
						time: new Date().getTime(),
						index: index - 1
					}
				}));
				Promise.all(que).then(resolve).catch(reject);
			} else {
				storage.getSync().set({
					backup: {
						time: new Date().getTime(),
						index: 0
					},
					backup_0: rules
				})
				.then(resolve)
				.catch(reject);
			}
		});
	},
	getMeta() {
		return new Promise((resolve, reject) => {
			storage.getSync().get("backup").then(e => {
				resolve(e.backup)
			}).catch(reject)
		});
	},
	getContent() {
		return new Promise((resolve, reject) => {
			storage.getSync().get("backup").then(e => {
				const index = e.backup.index;
				const result = {};
				utils.TABLE_NAMES.forEach(e => {
					result[e] = []
				});
				const toGet = [];
				for (let i = 0; i <= index; i++) {
					toGet.push("backup_" + i);
				}
				storage.getSync().get(toGet).then(res => {
					toGet.forEach(name => {
						utils.TABLE_NAMES.forEach(e => {
							result[e] = result[e].concat(res[name][e]);
						});
					});
					console.log(result);
					resolve(result);
				});
			}).catch(reject)
		});
	},
	clear() {
		return new Promise((resolve, reject) => {
			const toRemove = ["backup"];
			storage.getSync().get("backup").then(e => {
				if (e.backup) {
					const index = e.backup.index;
					const result = {};
					utils.TABLE_NAMES.forEach(e => {
						result[e] = []
					});
					for (let i = 0; i <= index; i++) {
						toRemove.push("backup_" + i);
					}
				}
				storage.getSync().remove(toRemove)
				.then(resolve)
				.catch(reject);
			}).catch(reject);
		});
	}
}