function startPageInit() {
	init({
		data: function() {
			return {
				isShowEdit: false,
				editTitle: t('add'),
				edit: {
					id: -1,
					name: "",
					ruleType: "cancel",
					ruleTypeEditable: true,
					matchType: "all",
					matchRule: "",
					excludeRule: "",
					redirectTo: "",
					headerName: "",
					headerValue: "",
					execType: 0,
					code: "",
					test: "",
					oldGroup: "",
					group: t('ungrouped')
				},
				activeTab: 0,
				group: {},
				alert: {
					show: false,
					text: ""
				},
				toast: {
					show: false,
					text: ""
				}
			};
		},
		computed: {
			testResult: function() {
				if (this.edit.test === "") {
					return "";
				}
				let isMatch = 0;
				switch (this.edit.matchType) {
					case 'all':
						isMatch = 1;
						break;
					case 'regexp':
						try {
							let reg = new RegExp(this.edit.matchRule, 'g');
							isMatch = reg.test(this.edit.test) ? 1 : 0;
						} catch (e) {
							isMatch = -1;
						}
						break;
					case 'prefix':
						isMatch = this.edit.test.indexOf(this.edit.matchRule) === 0 ? 1 : 0;
						break;
					case 'domain':
						isMatch = getDomain(this.edit.test) === this.edit.matchRule ? 1 : 0;
						break;
					case 'url':
						isMatch = this.edit.test === this.edit.matchRule ? 1 : 0;
						break;
					default:
						break;
				}
				if (isMatch === 1 && typeof(this.edit.matchRule) === 'string' && this.edit.excludeRule.length > 0) {
					try {
						let reg = new RegExp(this.edit.excludeRule);
						isMatch = reg.test(this.edit.test) ? 2 : 1;
					} catch (e) {
						isMatch = 1;
					}
				}
				if (isMatch === -1) {
					return t('test_invalid_regexp');
				} else if (isMatch === 0) {
					return t('test_mismatch');
				} else if (isMatch === 2) {
					return t('test_exclude');
				}
				if (this.edit.execType == 1) {
					return t('test_custom_code');
				} else {
					// if this is a redirect rule, show the result
					if (this.edit.ruleType === 'redirect') {
						let redirect = '';
						if (this.edit.matchType === 'regexp') {
							redirect = this.edit.test.replace(new RegExp(this.edit.matchRule, 'g'), this.edit.redirectTo);
						} else {
							redirect = this.edit.redirectTo;
						}
						if (/^(http|https|ftp|file)%3A/.test(redirect)) {
							redirect = decodeURIComponent(redirect);
						}
						return redirect;
					} else {
						return 'Matched';
					}
				}
			},
			groupList: function() {
				return Object.keys(this.group);
			}
		},
		methods: {
			showAlert: function(text) {
				this.alert.text = text;
				this.alert.show = true;
			},
			showToast: function(text) {
				this.toast.text = text;
				this.toast.show = true;
			},
			// Show add page
			showAddPage: function() {
				this.editTitle = t('add');
				this.isShowEdit = true;
			},
			closeEditPage: function() {
				this.isShowEdit = false;
				this.edit.id = -1;
				this.edit.name = "";
				this.edit.ruleType = "cancel";
				this.edit.ruleTypeEditable = true;
				this.edit.matchType = "all";
				this.edit.matchRule = "";
				this.edit.excludeRule = "";
				this.edit.redirectTo = "";
				this.edit.headerName = "";
				this.edit.headerValue = "";
				this.edit.execType = 0;
				this.edit.code = "";
				this.edit.test = "";
				this.edit.oldGroup = "";
				this.edit.group = t('ungrouped');
			},
			saveRule: function() {
				const _this = this;
				const data = {
					"enable": 1,
					"name": this.edit.name,
					"ruleType": this.edit.ruleType,
					"matchType": this.edit.matchType,
					"pattern": this.edit.matchRule,
					"exclude": this.edit.excludeRule,
					"group": this.edit.group,
					"isFunction": this.edit.execType == 1
				};
				const table = ruleType2tableName(data.ruleType);
				if (data.group === '') {
					data.group = t('ungrouped');
				}
				if (data.name === '') {
					this.showAlert(t('name_empty'));
					return;
				}
				if (data.matchType !== 'all' && data.matchRule === '') {
					this.showAlert(t('match_rule_empty'));
					return;
				}
				if (data.isFunction) {
					data.code = this.edit.code;
					if (data.code === '') {
						this.showAlert(t('code_empty'));
						return;
					}
					// test code
					try {
						new Function('val', 'detail', data.code);
					} catch (e) {
						this.showAlert(e.message);
						return;
					}
				} else {
					if (data.ruleType === 'redirect') {
						if (this.edit.redirectTo === '') {
							this.showAlert(t('redirect_empty'));
							return;
						}
						data.action = 'redirect';
						data.to = this.edit.redirectTo;
					}
					if ((this.edit.ruleType === 'modifySendHeader' || this.edit.ruleType === 'modifyReceiveHeader')) {
						if (this.edit.headerName === '') {
							this.showAlert(t('header_empty'));
							return;
						}
						data.action = {
							"name": this.edit.headerName,
							"value": this.edit.headerValue
						};
					}
				}
				//make save data
				if (this.edit.ruleType === 'cancel') {
					data.action = 'cancel';
				}
				if (this.edit.id !== -1) {
					data.id = this.edit.id;
				}
				window.saveRule(table, data).then(function(response) {
					if (_this.edit.id && _this.edit.id !== -1) {
						// Move group if required
						if (_this.edit.oldGroup != data.group) {
							_this.$delete(_this.group[data.group].rule, table + '-' + data.id);
						}
					}
					if (!_this.group[response.group]) {
						_this.$set(_this.group, response.group, {
							name: response.group,
							rule: {}
						});
					}
					_this.$set(_this.group[response.group].rule, table + '-' + response.id, response);
					browser.runtime.sendMessage({"method": "updateCache", "type": table});
					_this.showToast(_this.t('saved'));
					_this.closeEditPage();
				});
			},
			editRule: function(rule) {
				this.edit.id = rule.id;
				this.edit.name = rule.name;
				this.edit.ruleType = rule.ruleType;
				this.edit.ruleTypeEditable = false;
				this.edit.matchType = rule.matchType;
				this.edit.matchRule = rule.pattern;
				this.edit.excludeRule = rule.exclude;
				this.edit.redirectTo = rule.to || "";
				this.edit.headerName = typeof(rule.action.name) === "string" ? rule.action.name : "";
				this.edit.headerValue = typeof(rule.action.value) === "string" ? rule.action.value : "";
				this.edit.execType = rule.isFunction ? 1 : 0;
				this.edit.code = rule.code || "";
				this.edit.oldGroup = rule.group;
				this.edit.group = rule.group;
				this.editTitle = t('edit');
				this.isShowEdit = true;
			},
			removeRule: function(r) {
				const _this = this;
				const table = ruleType2tableName(r.ruleType);
				const key = table + '-' + r.id;
				deleteRule(table, r.id).then((response) => {
					browser.runtime.sendMessage({"method": "updateCache", "type": table});
					Object.keys(_this.group).forEach(e => {
						if (typeof(_this.group[e].rule[key]) !== "undefined") {
							_this.$delete(_this.group[e].rule, key);
						}
					});
				});
			},
			// Enable or disable a rule
			onRuleEnable: function(e) {
				console.log(e);
			}
		},
		mounted: function() {
			const _this = this;
			// Load rules
			(function() {
				_this.$set(_this.group, t('ungrouped'), {
					name: t('ungrouped'),
					rule: {}
				});
				function appendRule(table, response) {
					for (const item of response) {
						if (typeof(_this.group[item.group]) === "undefined") {
							_this.$set(_this.group, item.group, {
								name: item.group,
								rule: {}
							});
						}
						_this.$set(_this.group[item.group].rule, table + '-' + item.id, item);
					}
				}
				function checkResult(table, response) {
					if (!response) { // Firefox is starting up
						requestRules(table);
						return;
					}
					appendRule(table, response);
				}
				function requestRules(table) {
					setTimeout(() => {
						checkResult(table, getRules(table));
					}, 20);
				}
				for (const t of tableNames) {
					requestRules(t);
				}
			})();
		}
	});
}

(function() {
	const wait = [];
	// Upgrade
	if (localStorage.getItem('dl_history')) {
		getLocalStorage().set({'dl_history': JSON.parse(localStorage.getItem('dl_history'))});
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
				for (const k of tableNames) {
					getDatabase().then((db) => {
						const tx = db.transaction([k], "readwrite");
						const os = tx.objectStore(k);
						os.openCursor().onsuccess = function(e) {
							const cursor = e.target.result;
							if (cursor) {
								const s = cursor.value;
								s.id = cursor.key;
								if (typeof(s.group) === "undefined") {
									s.group = findGroup(ruleType2tableName(s.ruleType), s.id);
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
				getLocalStorage().get('groups').then(r => {
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
})();

/*let waitToImport = null;
let cachedGroupList = {};
let templateId = 1; // used by template

function addRuleEl(rule, type, notAutoMove) {
	let e = template.rule.cloneNode(true);
	const uniqid = type + '-' + rule.id;
	e.setAttribute('id', 'rule-' + uniqid);
	e.setAttribute('data-id', rule.id);
	e.setAttribute('data-table', type);
	e.setAttribute('data-type', rule.ruleType);
	const name = e.querySelector('.name-label');
	const detail = name.nextElementSibling;
	name.appendChild(document.createTextNode(rule.name));
	name.setAttribute('id', 'detail-' + uniqid);
	// detail
	detail.classList.add('mdl-tooltip');
	detail.setAttribute('for', 'detail-' + uniqid);
	if (!IS_MOBILE) {
		detail.querySelector('.match-type').appendChild(document.createTextNode(t('match_' + rule.matchType)));
		if (rule.matchType === 'all') {
			detail.querySelector('.pattern').parentElement.remove();
		} else {
			detail.querySelector('.pattern').appendChild(document.createTextNode(rule.pattern));
		}
		detail.classList.add('exec-' + (rule.isFunction ? 'func' : 'normal'));
		detail.querySelector('.exec_type').appendChild(document.createTextNode(t(rule.isFunction ? 'exec_function' : 'exec_normal')));
		if (!rule.isFunction) {
			if (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') {
				detail.querySelector('.headerName').appendChild(document.createTextNode(rule.action.name));
				detail.querySelector('.headerValue').appendChild(document.createTextNode(rule.action.value));
			} else if (rule.ruleType === 'redirect') {
				detail.querySelector('.redirectTo').appendChild(document.createTextNode(rule.to));
			}
		}
	}
	e.querySelector('.rule-type').appendChild(document.createTextNode(t('rule_' + rule.ruleType)));
	e.querySelector('.move-group').addEventListener('click', onMoveGroupClick);
	e.querySelector('.edit').addEventListener('click', onEditRuleClick);
	e.querySelector('.remove').addEventListener('click', onRemoveRuleClick);
	// enable switcher
	const enableSwitcher = e.querySelector('.enable-switcher');
	const enableCheckbox = enableSwitcher.querySelector('input');
	enableSwitcher.setAttribute('for', 'switcher-' + uniqid);
	enableCheckbox.setAttribute('id', 'switcher-' + uniqid);
	enableCheckbox.checked = rule.enable;
	enableCheckbox.addEventListener('change', onEnableRuleChange);
	// Batch checkbox
	const batchSwitcher = e.querySelector('.batch-checkbox');
	const batchCheckbox = batchSwitcher.querySelector('input');
	batchSwitcher.setAttribute('for', 'batch-' + uniqid);
	batchCheckbox.setAttribute('id', 'batch-' + uniqid);
	if (typeof(componentHandler) !== 'undefined') {
		componentHandler.upgradeElement(enableSwitcher, 'MaterialSwitch');
		componentHandler.upgradeElement(batchSwitcher, 'MaterialCheckbox');
		if (!IS_MOBILE) {
			// To avoid uglifyes's error, the follow two lines can not be merged
			let _t = null;
			_t = setTimeout(() => {
				componentHandler.upgradeElement(detail, 'MaterialTooltip');
				clearTimeout(_t);
			}, 300);
		}
	}
	if (!notAutoMove) {
		moveItemToGroup(e, rule.id, findItemInGroup(rule.id, type), type);
	}
	return e;
}


//edit
function onEditRuleClick() {
	const tr = this.parentElement.parentElement;
	const body = document.getElementById('edit-body');
	const id = tr.getAttribute('data-id');
	const table = ruleType2tableName(tr.getAttribute('data-type'));
	clearEditPage();
	document.querySelector('#edit-head .mdl-layout-title').innerHTML = t('edit');
	document.querySelector('#edit-body .title').innerHTML = t('edit');
	const rule = getRules(table, {"id": id})[0];
	document.getElementById('ruleId').value = id;
	mdlSetValue(document.getElementById('rule-name'), rule.name);
	mdlSetValue(document.getElementById('matchRule'), rule.pattern);
	mdlSetValue(document.getElementById('excludeRule'), rule.exclude ? rule.exclude : '');
	mdlRadioSet("ruleType", rule.ruleType, body);
	mdlRadioDisable("ruleType", true, body);
	mdlRadioSet("matchType", rule.matchType, body);
	mdlRadioSet("execType", rule.isFunction ? 1 : 0, body);
	body.setAttribute('data-type', rule.ruleType);
	body.setAttribute('data-isfunction', rule.isFunction ? 1 : 0);
	body.setAttribute('data-match', rule.matchType);
	if (rule.isFunction) {
		mdlSetValue(document.getElementById('custom-code'), rule.code);
	} else {
		if (rule.ruleType === 'redirect') {
			mdlSetValue(document.getElementById('redirectTo'), rule.to);
		}
		if (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') {
			mdlSetValue(document.getElementById('headerName'), rule.action.name);
			mdlSetValue(document.getElementById('headerValue'), rule.action.value);
		}
	}
	// Group
	const oldGroup = findItemInGroup(id, table);
	body.querySelector('.group-name').innerHTML = oldGroup;
	body.querySelector('.group-name').setAttribute('data-name', oldGroup);
	showEditPage();
}
//remove
function onRemoveRuleClick() {
	const tr = this.parentElement.parentElement;
	const id = tr.getAttribute('data-id');
	const table = ruleType2tableName(tr.getAttribute('data-type'));
	deleteRule(table, id).then((response) => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
		tr.remove();
	});
}
//enable or disable
function onEnableRuleChange () {
	const tr = findParent(this, (e) => { return e.tagName.toLowerCase() === 'tr'});
	const id = tr.getAttribute('data-id');
	const table = ruleType2tableName(tr.getAttribute('data-type'));
	const enable = this.checked ? 1 : 0;
	saveRule(table, {"id": id, "enable": enable}).then(() => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
	});
}
//save rule
function onRuleSaveClick() {
	const body = document.getElementById('edit-body');
	//check
	let data = {
		"enable": 1,
		"name": document.getElementById('rule-name').value,
		"ruleType": body.querySelector('input[name="ruleType"]:checked').value,
		"matchType": body.querySelector('input[name="matchType"]:checked').value,
		"pattern": document.getElementById('matchRule').value,
		"exclude": document.getElementById('excludeRule').value,
		"isFunction": body.querySelector('input[name="execType"]:checked').value == 1
	};
	const redirectTo = document.getElementById('redirectTo').value;
	const headerName = document.getElementById('headerName').value;
	const headerValue = document.getElementById('headerValue').value;
	const ruleId = document.getElementById('ruleId').value;
	const code = document.getElementById('custom-code').value;
	const table = ruleType2tableName(data.ruleType);
	const newGroup = body.querySelector('.group-name').getAttribute('data-name');
	if (data.name === '') {
		alert(t('name_empty'));
		return;
	}
	if (data.matchType !== 'all' && data.matchRule === '') {
		alert(t('match_rule_empty'));
		return;
	}
	if (data.isFunction) {
		if (code === '') {
			alert(t('code_empty'));
			return;
		}
	} else {
		if (data.ruleType === 'redirect' && redirectTo === '') {
			alert(t('redirect_empty'));
			return;
		}
		if ((data.ruleType === 'modifySendHeader' || data.ruleType === 'modifyReceiveHeader') && headerName === '') {
			alert(t('header_empty'));
			return;
		}
	}
	//make save data
	if (data.ruleType === 'cancel') {
		data.action = 'cancel';
	}
	if (data.isFunction) {
		data.code = code;
		// test code
		try {
			new Function('val', 'detail', code);
		} catch (e) {
			alert(e.message);
			return;
		}
	} else {
		if (data.ruleType === 'redirect') {
			data.action = 'redirect';
			data.to = redirectTo;
		}
		if (data.ruleType === 'modifySendHeader' || data.ruleType === 'modifyReceiveHeader') {
			data.action = {
				"name": headerName,
				"value": headerValue
			};
		}
	}
	if (ruleId !== '') {
		data.id = ruleId;
	}
	saveRule(table, data).then(function(response) {
		if (ruleId !== '') {
			let oldGroup = findItemInGroup(ruleId, table);
			let el = document.getElementById('rule-' + table + '-' + ruleId);
			let newEl = addRuleEl(response, table, true);
			if (oldGroup !== newGroup) {
				el.remove();
				//edit a rule and move to a new group
				moveItemToGroup(newEl, response.id, newGroup, table);
			} else {
				//not move
				el.parentElement.insertBefore(newEl, el);
				el.remove();
			}
		} else {
			let el = addRuleEl(response, table, true);
			moveItemToGroup(el, response.id, newGroup, table);
		}
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
		hideEditPage();
	});
}

//export
function onExportClick() {
	var allResult = {};
	saveAsFile(
		JSON.stringify(createExportFormat(browser.extension.getBackgroundPage().cachedRules)),
		DateFormat(HE_DUMP_FILE_NAME).replace('{ADDITIONAL}', '-All')
	);
}

//import
function setImportStatus(s) {
	const box = document.getElementById('import-confirm');
	box.classList.add(s);
	['waiting-select', 'loading', 'waiting-confirm'].forEach(t => {
		if (s !== t) {
			box.classList.remove(t);
		}
	});
}
function importFromString(str) {
	waitToImport = {};
	content = JSON.parse(str);
	for (let key of tableNames) {
		waitToImport[key] = [];
	}
	for (let key of tableNames) {
		for (let item of content[key]) {
			delete item.id;
			waitToImport[key].push(upgradeRuleFormat(item));
		}
	}
	showImportModal();
}
function onImportClick() {
	loadFromFile('.json').then(function(content) {
		setImportStatus('loading');
		importFromString(content);
	});
}
function showImportModal() {
	const box = document.getElementById('import-confirm');
	// Contents
	const tbody = document.getElementById('import-list');
	tbody.innerHTML = '';
	for (let key of tableNames) {
		for (const id in waitToImport[key]) {
			const item = waitToImport[key][id];
			const elementId = key + '-' + id;
			let n = template.importRule.cloneNode(true);
			n.setAttribute('id', elementId);
			n.querySelector('.name').appendChild(document.createTextNode(item.name));
			n.querySelector('.rule-type').appendChild(document.createTextNode(t('rule_' + item.ruleType)));
			let rules = getRules(key, {"name": item.name});
			if (rules.length) {
				n.setAttribute('data-oldid', rules[0].id);
				n.classList.add('keep');
				n.querySelector('input[value="new"]').checked = true;
			} else {
				n.classList.add('new');
				n.querySelector('input[value="yes"]').checked = true;
			}
			n.querySelectorAll('.mdl-radio').forEach((e) => {
				const id = 'import-' + elementId + '-' + (templateId++);
				e.setAttribute('for', id);
				e.querySelector('input[type="radio"]').setAttribute('id', id);
				e.querySelector('input[type="radio"]').setAttribute('name', elementId);
				if (typeof(componentHandler) !== 'undefined' && !e.classList.contains('is-upgraded')) {
					componentHandler.upgradeElement(e, 'MaterialRadio');
					componentHandler.upgradeElement(e.querySelector('.mdl-js-ripple-effect'), 'MaterialRipple');
				}
			});
			tbody.appendChild(n);
		}
	}
	setImportStatus('waiting-confirm');
	document.getElementById('main-body').scrollTo(0, box.offsetTop);
}
function onImportSubmit() {
	let total = 0;
	let finish = 0;
	let toSave = {};
	let groupName = document.getElementById('import-group').getAttribute('data-name');
	function checkFinish() {
		if (total === finish) {
			saveGroups().then(() => {
				browser.runtime.sendMessage({"method": "updateCache", "type": "all"});
				setTimeout(() => {
					window.location.reload();
				}, 500);
			});
		}
	}
	for (let key of tableNames) {
		toSave[key] = [];
		for (const id in waitToImport[key]) {
			const elementId = key + '-' + id;
			let c = document.querySelector('input[name="' + elementId + '"]:checked');
			let item = waitToImport[key][id];
			if (c.value === 'old' || c.value === 'no') {
				continue;
			}
			total++;
			if (c.value === 'new') {
				item.id = document.getElementById(elementId).getAttribute('data-oldid');
			}
			toSave[key].push(item);
		}
	}
	for (let key of tableNames) {
		for (const item of toSave[key]) {
			saveRule(key, item).then((r) => {
				if (groupName !== t('ungrouped')) {
					cachedGroupList[groupName].push(key + '-' + r.id);
				}
				finish++;
				checkFinish();
			});
		}
	}
}

// Batch mode
function onBatchModeClick() {
	if (document.querySelector('.rule-list').classList.contains('batch-mode')) {
		setFloatButton('default-button');
	} else {
		setFloatButton('batch-button');
	}
	//unselect all
	document.querySelectorAll('.batch-checkbox').forEach((e) => {
		mdlCheckboxSet(e, false);
	});
	document.querySelectorAll('.rule-list').forEach((e) => {
		e.classList.toggle('batch-mode');
	});
}
function onBatchSelectAll() {
	if (!document.querySelector('input[name="batch"]')) {
		return;
	}
	const setTo = document.querySelector('input[name="batch"]').checked ? false : true;
	document.querySelectorAll('.batch-checkbox').forEach((e) => {
		mdlCheckboxSet(e, setTo);
	});
}
function onBatchEnable() {
	document.querySelectorAll('input[name="batch"]:checked').forEach((e) => {
		const tr = findParent(e, (el) => { return el.tagName.toLowerCase() === 'tr'});
		const id = tr.getAttribute('data-id');
		const table = ruleType2tableName(tr.getAttribute('data-type'));
		const enable = tr.querySelector('.enable-switcher input[type="checkbox"]').checked ? 0 : 1;
		mdlCheckboxSet(tr.querySelector('.enable-switcher'), enable);
		saveRule(table, {"id": id, "enable": enable}).then(() => {
			browser.runtime.sendMessage({"method": "updateCache", "type": table});
		});
	});
}
function onBatchDeleteClick() {
	if (!confirm(t('delete_confirm'))) {
		return;
	}
	let all = document.querySelectorAll('input[name="batch"]:checked');
	let total = all.length;
	let ok = 0;
	let tables = [];
	all.forEach((e) => {
		let tr = findParent(e, (c) => { return c.nodeName.toLowerCase() === 'tr'; });
		let id = tr.getAttribute('data-id');
		let table = tr.getAttribute('data-table');
		deleteRule(table, id).then((response) => {
			if (!tables.includes(table)) {
				tables.push(table);
			}
			tr.remove();
			ok++;
			if (ok === total) {
				for (const t of tables) {
					browser.runtime.sendMessage({"method": "updateCache", "type": t});
				}
			}
		});
	});
}
function onBatchShareClick() {
	let result = {};
	for (const t of tableNames) {
		result[t] = [];
	}
	document.querySelectorAll('input[name="batch"]:checked').forEach((e) => {
		const el = findParent(e, (c) => { return c.nodeName.toLowerCase() === 'tr'; });
		const table = el.getAttribute('data-table');
		const id = el.getAttribute('data-id');
		result[table].push(getRules(table, {"id": id})[0]);
	});
	saveAsFile(
		JSON.stringify(createExportFormat(result), null, "\t"),
		DateFormat(HE_DUMP_FILE_NAME).replace('{ADDITIONAL}', '')
	);
}
function onBatchGroupClick() {
	chooseGroup().then(name => {
		document.querySelectorAll('input[name="batch"]:checked').forEach((e) => {
			let el = findParent(e, (c) => { return c.nodeName.toLowerCase() === 'tr'; });
			moveItemToGroup(el, el.getAttribute('data-id'), name, el.getAttribute('data-table'));
		});
	}).catch(() => {});
}
function onBatchGroupSelect() {
	const p = findParent(this, (e) => { return e.classList.contains('rule-list'); });
	if (!p.querySelector('input[name="batch"]')) {
		return;
	}
	const setTo = p.querySelector('input[name="batch"]').checked ? false : true;
	p.querySelectorAll('.batch-checkbox').forEach((e) => {
		mdlCheckboxSet(e, setTo);
	});
}

// Download rules
function downloadRule(url) {
	setImportStatus('loading');
	getURL(url).then((str) => {
		importFromString(str);
	});
}
function loadDownloadHistory() {
	getLocalStorage().get('dl_history').then(r => {
		if (r.dl_history === undefined) {
			return;
		}
		const dl_history_box = document.getElementById('download-history');
		dl_history_box.innerHTML = '';
		for (const url of r.dl_history) {
			let n = template.dlHistory.cloneNode(true);
			n.querySelector('.url').setAttribute('data-url', url);
			n.querySelector('.url').appendChild(document.createTextNode(url));
			n.querySelector('.download').addEventListener('click', onHistoryDownload);
			n.querySelector('.edit').addEventListener('click', onHistoryEdit);
			n.querySelector('.remove').addEventListener('click', onHistoryRemove);
			dl_history_box.appendChild(n);
		}
	});
}
function onHistoryDownload() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	downloadRule(url);
}
function onHistoryEdit() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	mdlSetValue(document.getElementById('download-url'), url);
	document.getElementById('download-url').focus();
}
function onHistoryRemove() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	getLocalStorage().get('dl_history').then(r => {
		if (r.dl_history === undefined) {
			return;
		}
		for (const index in r.dl_history) {
			if (r.dl_history[index] === url) {
				r.dl_history.splice(index, 1);
				break;
			}
		}
		getLocalStorage().set({'dl_history': r.dl_history}).then(loadDownloadHistory);
	});
}
function addHistory(url) {
	getLocalStorage().get('dl_history').then(r => {
		let list = (r.dl_history === undefined) ? [] : r.dl_history;
		if (!list.includes(url)) {
			list.push(document.getElementById('download-url').value);
			getLocalStorage().set({'dl_history': list}).then(loadDownloadHistory);
		}
	});
}

function onHideEmptyGroupChange() {
	document.getElementById('hideEmptyGroupStyle').disabled = !this.checked;
}
function checkEmptyGroup(el) {
	if (el.querySelector('.rule-item')) {
		el.classList.remove('empty');
	} else {
		el.classList.add('empty');
	}
}
function onMoveGroupClick() {
	const e = this.parentElement.parentElement;
	chooseGroup().then(name => {
		moveItemToGroup(e, e.getAttribute('data-id'), name, e.getAttribute('data-table'));
	}).catch(() => {});
}
function moveItemToGroup(from, id, groupName, type) {
	if (typeof(id) !== 'number') {
		id = parseInt(id);
	}
	const g = document.querySelector('#groups .group-item[data-name="' + groupName + '"] .rules-list');
	const oldGroup = findItemInGroup(id, type);
	if (oldGroup !== groupName) {
		// move cachedGroupList
		if (oldGroup !== t('ungrouped')) {
			cachedGroupList[oldGroup].splice(cachedGroupList[oldGroup].indexOf(type + '-' + id), 1);
			saveGroups();
		}
		if (groupName !== t('ungrouped')) {
			cachedGroupList[groupName].push(type + '-' + id);
			saveGroups();
		}
	}
	// move element
	g.appendChild(from);
	// Check empty
	let _t = setTimeout(() => {
		checkEmptyGroup(document.querySelector('#groups .group-item[data-name="' + oldGroup + '"]'));
		checkEmptyGroup(document.querySelector('#groups .group-item[data-name="' + groupName + '"]'));
		clearTimeout(_t);
	}, 100);
}
function findItemInGroup(id, type) {
	for (let i in cachedGroupList) {
		if (cachedGroupList[i].includes(type + '-' + id)) {
			return i;
		}
	}
	const ungrouped = t('ungrouped');
	return typeof(cachedGroupList[ungrouped]) === "undefined" ? Object.keys(cachedGroupList)[0] : ungrouped;
}
function initGroup() {
	const groupMenu = document.querySelector('#group-dialog .mdl-dialog__content');
	getLocalStorage().get('groups').then(r => {
		if (r.groups === undefined) {
			cachedGroupList[t('ungrouped')] = [];
			saveGroups();
		} else {
			cachedGroupList = r.groups;
		}
		Object.keys(cachedGroupList).forEach((e) => {
			addGroupEl(e);
		});
		// new
		let n = template.groupMenuListNew.cloneNode(true);
		let new_id = n.querySelector('.mdl-radio').getAttribute('for') + (templateId++);
		n.querySelector('.mdl-radio').setAttribute('for', new_id);
		n.querySelector('input[type="radio"]').setAttribute('id', new_id);
		n.querySelector('input[type="radio"]').value = '_new';
		// event
		n.querySelector('#group-add').addEventListener('focus', () => {
			if (groupMenu.querySelector('.is-checked').getAttribute('data-isnew') != 1) {
				groupMenu.querySelector('.is-checked input[type="radio"]').checked = false;
				groupMenu.querySelector('.is-checked').classList.remove('is-checked');
				n.querySelector('.mdl-radio').classList.add('is-checked');
				n.querySelector('input[type="radio"]').checked = true;
			}
		});
		groupMenu.appendChild(n);
	});
}
function addGroupEl(name) {
	if (document.querySelector('#groups .group-item[data-name="' + name + '"]') !== null) {
		return;
	}
	const group = document.getElementById('groups');
	const groupMenu = document.querySelector('#group-dialog .mdl-dialog__content');
	let n = template.groupMenuList.cloneNode(true);
	let n_label = n.querySelector('.mdl-radio');
	let new_id = n_label.getAttribute('for') + (templateId++);
	n_label.setAttribute('for', new_id);
	n.querySelector('input[type="radio"]').setAttribute('id', new_id);
	n.querySelector('input[type="radio"]').value = name;
	n.querySelector('.mdl-radio__label').appendChild(document.createTextNode(name));
	// material design
	if (typeof(componentHandler) !== 'undefined' && !n_label.classList.contains('is-upgraded')) {
		componentHandler.upgradeElement(n_label, 'MaterialRadio');
		componentHandler.upgradeElement(n_label.querySelector('.mdl-js-ripple-effect'), 'MaterialRipple');
	}
	groupMenu.appendChild(n);
	let n_group = template.groupItem.cloneNode(true);
	n_group.setAttribute('data-name', name);
	n_group.innerHTML = n_group.innerHTML.replace(/\{id\}/g, templateId++);
	n_group.querySelector('.title').appendChild(document.createTextNode(name));
	n_group.querySelector('.rename').addEventListener('click', onGroupRenameClick);
	n_group.querySelector('.share').addEventListener('click', onGroupShareClick);
	n_group.querySelector('.remove').addEventListener('click', onGroupRemoveClick);
	// toggle box
	n_group.querySelector('.mdl-card__title-text').addEventListener('click', function() {
		this.parentElement.parentElement.classList.toggle('close');
	});
	n_group.querySelector('.toggle-box').addEventListener('click', function() {
		this.parentElement.parentElement.classList.toggle('close');
	});
	if (prefs.get('manage-collapse-group')) {
		n_group.querySelector('.closeable-box').classList.add('close');
	}
	group.appendChild(n_group);
	// select and unselect all
	n_group.querySelector('th.batch').addEventListener('click', onBatchGroupSelect);
}
function saveGroups() {
	return getLocalStorage().set({'groups' : cachedGroupList});
}
function onGroupShareClick() {
	const el = findParent(this, (e) => { return e.classList.contains('group-item'); });
	let result = {};
	for (const t of tableNames) {
		result[t] = [];
	}
	el.querySelectorAll('.rules-list tr').forEach((e) => {
		const table = e.getAttribute('data-table');
		const id = e.getAttribute('data-id');
		result[table].push(getRules(table, {"id": id})[0]);
	});
	saveAsFile(
		JSON.stringify(createExportFormat(result), null, "\t"),
		DateFormat(HE_DUMP_FILE_NAME).replace('{ADDITIONAL}', '-' + el.querySelector('.title').innerHTML)
	);
}
function onGroupRemoveClick() {
	const el = findParent(this, (e) => { return e.classList.contains('group-item'); });
	const name = el.getAttribute('data-name');
	if (name === t('ungrouped')) {
		// can not delete default group
		return;
	}
	delete cachedGroupList[name];
	saveGroups().then(() => {
		window.location.reload();
	});
}
function onGroupRenameClick() {
	const el = findParent(this, (e) => { return e.classList.contains('group-item'); });
	const name = el.getAttribute('data-name');
	if (name === t('ungrouped')) {
		// can not rename default group
		return;
	}
	let new_name = window.prompt(t('enter_group_name'), name);
	if (name) {
		cachedGroupList[new_name] = deepCopy(cachedGroupList[name]);
		delete cachedGroupList[name];
	}
	saveGroups().then(() => {
		window.location.reload();
	});
}
function chooseGroup() {
	return new Promise((resolve, reject) => {
		const dialog = document.getElementById('group-dialog');
		if (!dialog.showModal) {
			dialogPolyfill.registerDialog(dialog);
		}
		if (dialog.querySelector('.is-checked')) {
			dialog.querySelector('.is-checked input[type="radio"]').checked = false;
			dialog.querySelector('.is-checked').classList.remove('is-checked');
		}
		dialog.querySelector('#group-add').value = '';
		dialog.querySelector('.mdl-radio').classList.add('is-checked');
		dialog.querySelector('.mdl-radio input[type="radio"]').checked = true;
		dialog.querySelector('.ok').addEventListener('click', function _ok() {
			let r = dialog.querySelector('input[type="radio"]:checked').value;
			this.removeEventListener('click', _ok);
			dialog.close();
			if (r === '_new') {
				r = dialog.querySelector('#group-add').value;
				cachedGroupList[r] = [];
				saveGroups().then(() => {
					addGroupEl(r);
					resolve(r);
				});
			} else {
				resolve(r);
			}
		});
		dialog.querySelector('.close').addEventListener('click', function _close() {
			this.removeEventListener('click', _close);
			dialog.close();
			reject();
		});
		dialog.showModal();
	});
}

function initRealtimeTest() {
	const body = document.getElementById('edit-body');
	document.getElementById('test-url').addEventListener('keyup', onRealtimeTest);
	document.getElementById('redirectTo').addEventListener('keyup', onRealtimeTest);
	document.getElementById('excludeRule').addEventListener('keyup', onRealtimeTest);
	document.getElementById('matchRule').addEventListener('keyup', onRealtimeTest);
	body.querySelectorAll('input[name="matchType"]').forEach(e => {
		e.addEventListener('change', onRealtimeTest);
	});
}
function onRealtimeTest() {
	const body = document.getElementById('edit-body');
	const data = {
		"ruleType": body.querySelector('input[name="ruleType"]:checked').value,
		"matchType": body.querySelector('input[name="matchType"]:checked').value,
		"pattern": document.getElementById('matchRule').value,
		"exclude": document.getElementById('excludeRule').value,
		"isFunction": body.querySelector('input[name="execType"]:checked').value == 1
	};
	const redirectTo = document.getElementById('redirectTo').value;
	const url = document.getElementById('test-url').value;
	const resultArea = document.getElementById('test-url-result');
	let isMatch = 0;
	switch (data.matchType) {
		case 'all':
			isMatch = 1;
			break;
		case 'regexp':
			try {
				let reg = new RegExp(data.pattern, 'g');
				isMatch = reg.test(url) ? 1 : 0;
			} catch (e) {
				isMatch = -1;
			}
			break;
		case 'prefix':
			isMatch = url.indexOf(data.pattern) === 0 ? 1 : 0;
			break;
		case 'domain':
			isMatch = getDomain(url) === data.pattern ? 1 : 0;
			break;
		case 'url':
			isMatch = url === data.pattern ? 1 : 0;
			break;
		default:
			break;
	}
	if (isMatch === 1 && typeof(data.exclude) === 'string' && data.exclude.length > 0) {
		try {
			let reg = new RegExp(data.exclude);
			isMatch = reg.test(url) ? 2 : 1;
		} catch (e) {
			isMatch = 1;
		}
	}
	if (isMatch === -1) {
		resultArea.innerHTML = t('test_invalid_regexp');
		return;
	} else if (isMatch === 0) {
		resultArea.innerHTML = t('test_mismatch');
		return;
	} else if (isMatch === 2) {
		resultArea.innerHTML = t('test_exclude');
		return;
	}
	if (data.isFunction) {
		resultArea.innerHTML = t('test_custom_code');
		return;
	} else {
		// if this is a redirect rule, show the result
		if (data.ruleType === 'redirect') {
			let redirect = '';
			if (data.matchType === 'regexp') {
				redirect = url.replace(new RegExp(data.pattern, 'g'), redirectTo);
			} else {
				redirect = redirectTo;
			}
			if (/^(http|https|ftp|file)%3A/.test(redirect)) {
				redirect = decodeURIComponent(redirect);
			}
			resultArea.innerHTML = '';
			resultArea.appendChild(document.createTextNode(redirect));
		} else {
			resultArea.innerHTML = '<i>Matched</i>';
		}
	}
}


function setFloatButton(id) {
	document.querySelectorAll('.float-button').forEach(e => {
		if (e.id === id) {
			e.style.display = 'block';
		} else {
			e.style.display = 'none';
		}
	});
}


function initAddAntiHotLink(url) {
	const body = document.getElementById('edit-body');
	clearEditPage();
	document.querySelector('#edit-head .mdl-layout-title').innerHTML = t('add');
	document.querySelector('#edit-body .title').innerHTML = t('add');
	mdlSetValue(document.getElementById('matchRule'), getDomain(url));
	mdlRadioSet("ruleType", 'modifySendHeader', body);
	mdlRadioSet("matchType", 'domain', body);
	mdlRadioSet("execType", 0, body);
	body.setAttribute('data-type', 'modifySendHeader');
	body.setAttribute('data-isfunction', 0);
	body.setAttribute('data-match', 'domain');
	mdlSetValue(document.getElementById('headerName'), 'Referer');
	mdlSetValue(document.getElementById('headerValue'), getDomain(url));
	showEditPage();
}

document.addEventListener('DOMContentLoaded', () => {

	setFloatButton('default-button');
	document.getElementById('rule-save').addEventListener('click', onRuleSaveClick);
	document.getElementById('save-rule').addEventListener('click', onRuleSaveClick);

	document.getElementById('add-rule').addEventListener('click', onAddRuleClick);
	document.getElementById('edit-back').addEventListener('click', onEditCancelClick);
	initEditChange();
	// options
	document.getElementById('manage-hide-empty').addEventListener('change', onHideEmptyGroupChange);
	setupLivePrefs([
		"manage-hide-empty",
		"manage-collapse-group",
		"add-hot-link",
		"exclude-he"
	]);
	// group
	initGroup();

	// Batch delete
	document.getElementById('batch-mode').addEventListener('click', onBatchModeClick);
	document.getElementById('batch-mode-exit').addEventListener('click', onBatchModeClick);
	document.getElementById('batch-select-all').addEventListener('click', onBatchSelectAll);
	document.getElementById('batch-enable').addEventListener('click', onBatchEnable);
	document.getElementById('batch-delete').addEventListener('click', onBatchDeleteClick);
	document.getElementById('batch-group').addEventListener('click', onBatchGroupClick);
	document.getElementById('batch-share').addEventListener('click', onBatchShareClick);

	// Import and Export rules
	document.getElementById('export').addEventListener('click', onExportClick);
	document.getElementById('import').addEventListener('click', onImportClick);
	document.getElementById('import-save').addEventListener('click', onImportSubmit);
	document.getElementById('import-cancel').addEventListener('click', () => {
		setImportStatus('waiting-select');
	});
	const importGroups = document.getElementById('import-group');
	importGroups.setAttribute('data-name', t('ungrouped'));
	importGroups.querySelector('.group-name').innerHTML = t('ungrouped');
	importGroups.addEventListener('click', function() {
		chooseGroup().then(r => {
			this.setAttribute('data-name', r);
			this.querySelector('.group-name').innerHTML = r;
		}).catch(() => {});
	});

	// Download rules
	document.getElementById('download-submit').addEventListener('click', () => {
		downloadRule(document.getElementById('download-url').value);
		addHistory(document.getElementById('download-url').value);
	});
	if (!IS_MOBILE) {
		document.querySelector('.download-input .mdl-textfield').style.width = 'calc(100% - ' + (document.querySelector('.download-input .buttons').offsetWidth + 25) + 'px)';
	}
	loadDownloadHistory();

	//Realtime test
	initRealtimeTest();

	loadRulesList();

	// Special actions
	let params = getParams();
	if (params.action === 'add-anti-hot-link') {
		setTimeout(() => {
			initAddAntiHotLink(params.url);
		}, 300);
	}
});
*/