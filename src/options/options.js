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
const oldVersion = parseInt(localStorage.getItem('version_mark'));
if (!(oldVersion >= 1)) {
	localStorage.setItem('version_mark', '1');
	// Upgrade group
	function rebindRuleWithGroup(group) {
		return new Promise(resolve => {
			const cacheQueue = [];
			function findGroup(type, id) {
				Object.keys(group).forEach(e => {
					if (group[e].includes(type + '-' + id)) {
						return e;
					}
				});
				return browser.i18n.getMessage('ungrouped');
			}
			for (const k of utils.TABLE_NAMES) {
				getDatabase().then((db) => {
					const tx = db.transaction([k], "readwrite");
					const os = tx.objectStore(k);
					os.openCursor().onsuccess = function(e) {
						const cursor = e.target.result;
						if (cursor) {
							const s = cursor.value;
							s.id = cursor.key;
							if (typeof(s.group) === "undefined") {
								s.group = findGroup(utils.getTableName(s.ruleType), s.id);
								os.put(s);
							}
							cursor.continue();
						} else {
							cacheQueue.push(browser.runtime.sendMessage({"method": "updateCache", "type": k}));
						}
					};
				});
			}
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
					rebindRuleWithGroup(r.groups).then(resolve);
				} else {
					const g = {};
					g[browser.i18n.getMessage('ungrouped')] = [];
					rebindRuleWithGroup(g).then(resolve);
				}
			});
		}
	}))
}
if (wait.length) {
	Promise.all(wait).then(startPageInit);
} else {
	startPageInit();
}
function startPageInit() {
	Vue.use(VueMaterial);
	new Vue({
		el: '#app',
		render: h => h(App)
	});
}