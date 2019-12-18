import Vue from 'vue';
import App from './App';
import browser from 'webextension-polyfill';
import VueMaterial from 'vue-material';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import './options.less';
import storage from '../share/core/storage';
import utils from '../share/core/utils';

Vue.use(VueMaterial);

const wait = [];
// Upgrade
if (localStorage.getItem('dl_history')) {
	storage.getLocal().set({'dl_history': JSON.parse(localStorage.getItem('dl_history'))});
	localStorage.removeItem('dl_history');
}

// Put a version mark
storage.getLocal().get('version_mark')
.then(v => {
	const version = v.version_mark ? parseInt(v.version_mark) : 0;
	if (!(version >= 1)) {
		storage.getLocal().set({
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
				storage.getLocal().get('groups').then(r => {
					if (r.groups !== undefined) {
						rebindRuleWithGroup(r.groups).then(() => {
							storage.getLocal().remove('groups');
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
	new Vue({
		el: '#app',
		render: h => h(App)
	});
}