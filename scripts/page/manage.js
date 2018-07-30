const PageManage = {
	getTestResult: function(data) {
		let isMatch = 0;
		switch (data.matchType) {
			case 'all':
				isMatch = 1;
				break;
			case 'regexp':
				try {
					let reg = new RegExp(data.matchRule, 'g');
					isMatch = reg.test(data.test) ? 1 : 0;
				} catch (e) {
					isMatch = -1;
				}
				break;
			case 'prefix':
				isMatch = data.test.indexOf(data.matchRule) === 0 ? 1 : 0;
				break;
			case 'domain':
				isMatch = getDomain(data.test) === data.matchRule ? 1 : 0;
				break;
			case 'url':
				isMatch = data.test === data.matchRule ? 1 : 0;
				break;
			default:
				break;
		}
		if (isMatch === 1 && typeof(data.matchRule) === 'string' && data.excludeRule.length > 0) {
			try {
				let reg = new RegExp(data.excludeRule);
				isMatch = reg.test(data.test) ? 2 : 1;
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
		if (data.execType == 1) {
			return t('test_custom_code');
		} else {
			// if this is a redirect rule, show the result
			if (data.ruleType === 'redirect') {
				let redirect = '';
				if (data.matchType === 'regexp') {
					redirect = data.test.replace(new RegExp(data.matchRule, 'g'), data.redirectTo);
				} else {
					redirect = data.redirectTo;
				}
				if (/^(http|https|ftp|file)%3A/.test(redirect)) {
					redirect = decodeURIComponent(redirect);
				}
				return redirect;
			} else {
				return 'Matched';
			}
		}
	}
}

function startPageInit() {
	init({
		data: function() {
			return {
				isShowEdit: false,
				isChooseGroup: false,
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
				options: {
					collapseGroup: prefs.get('manage-collapse-group'),
					rulesNoEffectForHe: prefs.get('exclude-he')
				},
				download: {
					url: "",
					log: []
				},
				activeTab: 0,
				group: {},
				choosenGroup: "",
				choosenNewGroup: "",
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
				return PageManage.getTestResult(this.edit);
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
			onChooseCancel: function() {
				this.choosenNewGroup = "";
				this.choosenGroup = "";
				this.isChooseGroup = false;
			},
			onChooseOK: function() {
				this.isChooseGroup = false;
			},
			chooseGroup: function() {
				const _this = this;
				return new Promise(resolve => {
					_this.choosenNewGroup = "";
					_this.choosenGroup = _this.t('ungrouped');
					_this.isChooseGroup = true;
					let _t = setInterval(() => {
						if (_this.isChooseGroup === false) {
							clearInterval(_t);
							_t = null;
							if (_this.choosenGroup === '_new') {
								if (_this.choosenNewGroup === "") {
									resolve(null);
								}
								if (typeof(_this.group[_this.choosenNewGroup]) === "undefined") {
									_this.$set(_this.group, _this.choosenNewGroup, {
										name: _this.choosenNewGroup,
										collapse: prefs.get('manage-collapse-group'),
										rule: {}
									});
								}
								resolve(_this.choosenNewGroup);
							} else {
								resolve(_this.choosenGroup === "" ? null : _this.choosenGroup);
							}
						}
					}, 100);
				});
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
							collapse: prefs.get('manage-collapse-group'),
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
			onRuleEnable: function(rule, newValue) {
				const table = ruleType2tableName(rule.ruleType);
				window.saveRule(table, rule).then(response => {
					browser.runtime.sendMessage({"method": "updateCache", "type": table});
				});
			},
			changeRuleGroup: function(rule, newGroup) {
				const _this = this;
				return new Promise(resolve => {
					const table = ruleType2tableName(rule.ruleType);
					const oldGroup = rule.group;
					_this.$delete(_this.group[oldGroup].rule, table + '-' + rule.id);
					rule.group = newGroup;
					_this.$set(_this.group[newGroup].rule, table + '-' + rule.id, rule);
					window.saveRule(table, rule).then(function(response) {
						resolve(response);
					});
				});
			},
			onChangeRuleGroup: function(rule) {
				const _this = this;
				this.chooseGroup()
				.then(r => {
					if (r !== null) {
						_this.changeRuleGroup(rule, r);
					}
				});
			},
			onGroupShare: function(name) {
				const result = {};
				for (const k of tableNames) {
					result[k] = [];
				}
				Object.values(this.group[name].rule).forEach(e => {
					result[ruleType2tableName(e.ruleType)].push(e);
				});
				saveAsFile(
					JSON.stringify(createExportFormat(result), null, "\t"),
					DateFormat(HE_DUMP_FILE_NAME).replace('{ADDITIONAL}', '-' + name)
				);
			},
			onGroupDelete: function(name) {
				// Delete group, but not delete rules, put all rules to "ungrouped"
				const ungrouped = t('ungrouped');
				if (name === ungrouped) {
					return;
				}
				const _this = this;
				Object.values(this.group[name].rule).forEach(e => {
					_this.changeRuleGroup(e, ungrouped);
				});
				this.$delete(this.group, name);
			}
		},
		mounted: function() {
			const _this = this;
			// Load rules
			(function() {
				_this.$set(_this.group, t('ungrouped'), {
					name: t('ungrouped'),
					collapse: prefs.get('manage-collapse-group'),
					rule: {}
				});
				function appendRule(table, response) {
					for (const item of response) {
						if (typeof(_this.group[item.group]) === "undefined") {
							_this.$set(_this.group, item.group, {
								name: item.group,
								collapse: prefs.get('manage-collapse-group'),
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
			// Load download history
			(function() {
				getLocalStorage().get('dl_history').then(r => {
					if (r.dl_history === undefined) {
						return;
					}
					_this.$set(_this.download, 'log', r.dl_history);
				});
			})();
			this.$watch('options', (newOpt) => {
				prefs.set('manage-collapse-group', newOpt.collapseGroup);
				prefs.set('exclude-he', newOpt.rulesNoEffectForHe);
			}, { deep: true });
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
