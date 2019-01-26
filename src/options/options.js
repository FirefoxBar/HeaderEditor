import Vue from 'vue';
import App from './App';
import browser from 'webextension-polyfill';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import './options.scss';
import storage from '../core/storage';
import utils from '../core/utils';

const wait = [];
// Upgrade
if (localStorage.getItem('dl_history')) {
	storage.getLocalStorage().set({'dl_history': JSON.parse(localStorage.getItem('dl_history'))});
	localStorage.removeItem('dl_history');
}

// Put a version mark
storage.getLocalStorage().get('version_mark')
.then(v => {
	const version = v.version_mark ? parseInt(v.version_mark) : 0;
	if (!(version >= 1)) {
		storage.getLocalStorage().set({
			version_mark: 1
		});
		// Upgrade group
		function rebindRuleWithGroup(group) {
			return new Promise(resolve => {
				const cacheQueue = [];
				function findGroup(type, id) {
					let result = browser.i18n.getMessage('ungrouped');
					for (const k in group) {
						if (group[k].includes(type + '-' + id)) {
							result = k;
							break;
						}
					}
					return result;
				}
				utils.TABLE_NAMES.forEach(k => {
					storage.getDatabase().then(db => {
						const tx = db.transaction([k], "readwrite");
						const os = tx.objectStore(k);
						os.openCursor().onsuccess = function(e) {
							const cursor = e.target.result;
							if (cursor) {
								const s = cursor.value;
								s.id = cursor.key;
								if (typeof(s.group) === "undefined") {
									s.group = findGroup(k, s.id);
									os.put(s);
								}
								cursor.continue();
							} else {
								cacheQueue.push(browser.runtime.sendMessage({"method": "updateCache", "type": k}));
							}
						};
					});
				})
				Promise.all(cacheQueue).then(resolve);
			});
		}
		wait.push(new Promise(resolve => {
			if (localStorage.getItem('groups')) {
				const g = JSON.parse(localStorage.getItem('groups'));
				localStorage.removeItem('groups');
				rebindRuleWithGroup(g).then(resolve);
			} else {
				storage.getLocalStorage().get('groups').then(r => {
					if (r.groups !== undefined) {
						rebindRuleWithGroup(r.groups).then(() => {
							storage.getLocalStorage().remove('groups');
							resolve();
						});
					} else {
						const g = {};
						g[browser.i18n.getMessage('ungrouped')] = [];
						rebindRuleWithGroup(g).then(resolve);
					}
				});
			}
		}));
	}
	if (wait.length) {
		Promise.all(wait).then(startPageInit);
	} else {
		startPageInit();
	}
})
function startPageInit() {
	Vue.use(VueMaterial);
	new Vue({
		el: '#app',
		render: h => h(App)
	});
}