<template>
	<div>
		<md-tabs class="md-primary main-menu" md-elevation="1" md-active-tab="tab-rule-list">
			<md-tab id="tab-rule-list" :md-label="t('rule_list')" md-icon="list">
				<md-table md-card v-for="g of group" :key="g.name" class="group-item">
					<md-table-toolbar>
						<h1 class="md-title">{{g.name}}</h1>
						<md-button class="md-icon-button" md-direction="bottom-end" @click="g.collapse = !g.collapse">
							<md-icon v-show="!g.collapse">keyboard_arrow_up</md-icon>
							<md-icon v-show="g.collapse">keyboard_arrow_down</md-icon>
						</md-button>
						<md-menu md-size="big" md-direction="bottom-end">
							<md-button class="md-icon-button" md-menu-trigger>
								<md-icon>more_vert</md-icon>
							</md-button>
								<md-menu-content>
								<md-menu-item>
									<span>{{t('rename')}}</span>
									<md-icon>mode_edit</md-icon>
								</md-menu-item>
								<md-menu-item @click="onGroupShare(g.name)">
									<span>{{t('share')}}</span>
									<md-icon>share</md-icon>
								</md-menu-item>
								<md-menu-item @click="onGroupDelete(g.name)">
									<span>{{t('delete')}}</span>
									<md-icon>delete</md-icon>
								</md-menu-item>
							</md-menu-content>
						</md-menu>
					</md-table-toolbar>
					<md-table-row v-show="!g.collapse">
						<md-table-head class="cell-enable">{{t('enable')}}</md-table-head>
						<md-table-head class="cell-name">{{t('name')}}</md-table-head>
						<md-table-head class="cell-type">{{t('ruleType')}}</md-table-head>
						<md-table-head class="cell-action">{{t('action')}}</md-table-head>
					</md-table-row>
					<md-table-row v-for="r of g.rule" :key="r.id" v-show="!g.collapse">
						<md-table-cell class="cell-enable">
							<md-switch v-model="r.enable" class="md-primary" :true-value="1" :false-value="0" :data-type="r.ruleType" :data-id="r.id" @change="newValue => onRuleEnable(r, newValue)"></md-switch>
						</md-table-cell>
						<md-table-cell class="cell-name">
							<span>{{r.name}}</span>
							<md-tooltip md-direction="bottom">
								<p>{{t('matchType')}}: {{t('match_' + r.matchType)}}</p>
								<p>{{t('matchRule')}}: {{r.pattern}}</p>
								<p>{{t('exec_type')}}: {{t('exec_' + (r.isFunction ? 'function' : 'normal'))}}</p>
								<p v-if="r.ruleType === 'redirect'">{{t('redirectTo')}}: {{r.to}}</p>
								<p v-if="r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader'">{{t('headerName')}}: {{r.action.name}}</p>
								<p v-if="r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader'">{{t('headerValue')}}: {{r.action.value}}</p>
							</md-tooltip>
						</md-table-cell>
						<md-table-cell class="cell-type">{{t('rule_' + r.ruleType)}}</md-table-cell>
						<md-table-cell class="cell-action">
							<md-button class="with-icon" @click="onChangeRuleGroup(r)"><md-icon>playlist_add</md-icon>{{t('group')}}</md-button>
							<md-button class="with-icon" @click="editRule(r)"><md-icon>mode_edit</md-icon>{{t('edit')}}</md-button>
							<md-button class="with-icon" @click="removeRule(r)"><md-icon>delete</md-icon>{{t('delete')}}</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</md-tab>
			<md-tab id="tab-options" :md-label="t('options')" md-icon="settings">
				<md-card>
					<md-card-header>
						<div class="md-title">{{t('options')}}</div>
					</md-card-header>
					<md-card-content>
						<div class="md-layout md-gutter">
							<div class="md-layout-item md-size-50"><md-checkbox v-model="options.collapseGroup">{{t('manage_collapse_group')}}</md-checkbox></div>
							<div class="md-layout-item md-size-50"><md-checkbox v-model="options.rulesNoEffectForHe">{{t('rules_no_effect_for_he')}}</md-checkbox></div>
						</div>
					</md-card-content>
				</md-card>
			</md-tab>
			<md-tab id="tab-export-import" :md-label="t('export_and_import')" md-icon="settings_backup_restore">
				<md-card>
					<md-card-header>
						<div class="md-title">{{t('local_files')}}</div>
					</md-card-header>
					<md-card-content>
						<md-button class="md-primary" @click="onExportAll">{{t('export')}}</md-button>
						<md-button class="md-primary" @click="onImport">{{t('import')}}</md-button>
					</md-card-content>
				</md-card>
				<md-card>
					<md-card-header>
						<div class="md-title">{{t('download_rule')}}</div>
					</md-card-header>
					<md-card-content>
						<md-field md-inline>
							<label>URL</label>
							<md-input v-model="download.url"></md-input>
						</md-field>
						<md-button class="md-icon-button"><md-icon>file_download</md-icon></md-button>
						<md-button class="with-icon"><md-icon>search</md-icon>{{t('third_party_rules')}}</md-button>
						<md-list>
							<md-list-item v-for="url of download.log" :key="url">
								<span class="md-list-item-text">{{url}}</span>
								<md-button class="md-icon-button md-list-action"><md-icon>file_download</md-icon></md-button>
								<md-button class="md-icon-button md-list-action"><md-icon>mode_edit</md-icon></md-button>
								<md-button class="md-icon-button md-list-action"><md-icon>delete</md-icon></md-button>
							</md-list-item>
						</md-list>
					</md-card-content>
				</md-card>
				<!-- import list -->
				<md-card>
					<md-card-header>
						<div class="md-title">{{t('import')}}</div>
					</md-card-header>
					<md-card-content>
						<md-progress-bar md-mode="indeterminate" v-show="imports.loading"></md-progress-bar>
						<md-table v-show="!imports.loading">
							<md-table-row>
								<md-table-head class="cell-name">{{t('name')}}</md-table-head>
								<md-table-head class="cell-type">{{t('ruleType')}}</md-table-head>
								<md-table-head class="cell-group">{{t('suggested_group')}}</md-table-head>
								<md-table-head class="cell-action">{{t('action')}}</md-table-head>
							</md-table-row>
							<md-table-row v-for="r of imports.list" :key="r.id">
								<md-table-cell class="cell-name">{{r.name}}</md-table-cell>
								<md-table-cell class="cell-type">{{t('rule_' + r.ruleType)}}</md-table-cell>
								<md-table-cell class="cell-group">
									<md-field><md-input v-model="r.group"></md-input></md-field>
								</md-table-cell>
								<md-table-cell class="cell-action">
									<md-radio class="md-primary" v-model="r.import_action" :value="1">{{t('import_new')}}</md-radio>
									<md-radio class="md-primary" v-model="r.import_action" :value="2" v-show="r.import_old_id">{{t('import_override')}}</md-radio>
									<md-radio class="md-primary" v-model="r.import_action" :value="3">{{t('import_drop')}}</md-radio>
								</md-table-cell>
							</md-table-row>
							<md-tab
						</md-table>
					</md-card-content>
				</md-card>
			</md-tab>
		</md-tabs>
		<div id="edit-page" v-show="isShowEdit">
			<md-toolbar class="md-primary" md-elevation="1">
				<md-button class="md-icon-button" @click="closeEditPage">
						<md-icon>arrow_back</md-icon>
				</md-button>
				<h2 class="md-title" style="flex: 1">{{editTitle}}</h2>
			</md-toolbar>
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-70 md-small-size-100">
					<md-card>
						<md-card-header>
							<md-card-header-text>
								<div class="md-title">{{editTitle}}</div>
							</md-card-header-text>
						</md-card-header>
						<md-card-content>
							<md-field>
								<label for="rule-name">{{t('name')}}</label>
								<md-input id="rule-name" v-model="edit.name" />
							</md-field>
							<div class="form-group">
								<div class="left">{{t('ruleType')}}</div>
								<div class="right">
									<md-radio class="md-primary" v-model="edit.ruleType" value="cancel"	:disabled="!edit.ruleTypeEditable">{{t('rule_cancel')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.ruleType" value="redirect"	:disabled="!edit.ruleTypeEditable">{{t('rule_redirect')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.ruleType" value="modifySendHeader"	:disabled="!edit.ruleTypeEditable">{{t('rule_modifySendHeader')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.ruleType" value="modifyReceiveHeader"	:disabled="!edit.ruleTypeEditable">{{t('rule_modifyReceiveHeader')}}</md-radio>
								</div>
							</div>
							<div class="form-group">
								<div class="left">{{t('matchType')}}</div>
								<div class="right">
									<md-radio class="md-primary" v-model="edit.matchType" value="all">{{t('match_all')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.matchType" value="regexp">{{t('match_regexp')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.matchType" value="prefix">{{t('match_prefix')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.matchType" value="domain">{{t('match_domain')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.matchType" value="url">{{t('match_url')}}</md-radio>
								</div>
							</div>
							<!-- Rule match rule -->
							<md-field v-show="edit.matchType != 'all'">
								<label for="rule-matchRule">{{t('matchRule')}}</label>
								<md-input id="rule-matchRule" v-model="edit.matchRule" />
							</md-field>
							<!-- Rule exclude rule -->
							<md-field v-show="edit.matchType != 'all'">
								<label for="rule-excludeRule">{{t('excludeRule')}}</label>
								<md-input id="rule-excludeRule" v-model="edit.excludeRule" />
							</md-field>
							<!-- isFunction or not -->
							<div class="form-group">
								<div class="left">{{t('exec_type')}}</div>
								<div class="right">
									<md-radio class="md-primary" v-model="edit.execType" :value="0">{{t('exec_normal')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.execType" :value="1">{{t('exec_function')}}</md-radio>
								</div>
							</div>
							<!-- redirect to -->
							<md-field v-show="edit.ruleType == 'redirect' && edit.execType == 0">
								<label for="rule-redirectTo">{{t('redirectTo')}}</label>
								<md-input id="rule-redirectTo" v-model="edit.redirectTo" />
							</md-field>
							<!-- header mondify -->
							<div v-show="(edit.ruleType == 'modifySendHeader' || edit.ruleType == 'modifyReceiveHeader') && edit.execType == 0">
								<md-field>
									<label for="rule-headerName">{{t('headerName')}}</label>
									<md-input id="rule-headerName" v-model="edit.headerName" />
								</md-field>
								<md-field>
									<label for="rule-headerValue">{{t('headerValue')}}</label>
									<md-input id="rule-headerValue" v-model="edit.headerValue" />
								</md-field>
							</div>
							<md-field v-show="edit.execType == 1">
								<label for="rule-code">{{t('code')}}</label>
								<md-textarea id="rule-code" v-model="edit.code"></md-textarea>
							</md-field>
						</md-card-content>
					</md-card>
				</div>
				<div class="md-layout-item md-size-30 md-small-size-100 edit-right">
					<md-card>
						<md-card-header>
							<md-card-header-text>
								<div class="md-title">{{t('test_url')}}</div>
							</md-card-header-text>
						</md-card-header>
						<md-card-content>
							<md-field>
								<label for="rule-test"></label>
								<md-input id="rule-test" v-model="edit.test" />
							</md-field>
							<code>{{testResult}}</code>
						</md-card-content>
					</md-card>
					<md-card>
						<md-card-header>
							<md-card-header-text>
								<div class="md-title">{{t('save')}}</div>
							</md-card-header-text>
						</md-card-header>
						<md-card-content>
							<md-autocomplete v-model="edit.group" :md-options="groupList" :md-fuzzy-search="false">
								<label>{{t('group')}}</label>
								<template slot="md-autocomplete-item" slot-scope="{ item, term }">
									<md-highlight-text :md-term="term">{{item}}</md-highlight-text>
								</template>
							</md-autocomplete>
							<md-button class="md-raised md-primary" @click="saveRule">{{t('save')}}</md-button>
						</md-card-content>
					</md-card>
				</div>
			</div>
		</div>
		<div class="float-button">
			<md-button class="md-fab md-primary" @click="showAddPage">
				<md-icon>add</md-icon>
			</md-button>
		</div>
		<md-dialog :md-active.sync="isChooseGroup">
			<md-dialog-title>{{t('group')}}</md-dialog-title>
			<md-list>
				<md-list-item v-for="g of groupList" :key="g">
					<md-radio v-model="choosenGroup" :value="g" />
					<span class="md-list-item-text">{{g}}</span>
				</md-list-item>
				<md-list-item class="md-radio-input">
					<md-radio v-model="choosenGroup" value="_new" />
					<md-field md-inline>
						<label>{{t('add')}}</label>
						<md-input v-model="choosenNewGroup"></md-input>
					</md-field>
				</md-list-item>
			</md-list>
			<md-dialog-actions>
				<md-button class="md-primary" @click="onChooseCancel">Close</md-button>
				<md-button class="md-primary" @click="onChooseOK">OK</md-button>
			</md-dialog-actions>
		</md-dialog>
		<md-dialog-alert :md-active.sync="alert.show" :md-content="alert.text" md-confirm-text="OK" />
		<md-snackbar md-position="center" :md-duration="4000" :md-active.sync="toast.show" md-persistent>{{toast.text}}</md-snackbar>
	</div>
</template>

<script>
import browser from 'webextension-polyfill';
import utils from '../core/utils';
import rules from '../core/rules';
import file from '../core/file';
import storage from '../core/storage';

export default {
	data: function() {
		return {
			isShowEdit: false,
			isChooseGroup: false,
			editTitle: utils.t('add'),
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
				group: utils.t('ungrouped')
			},
			options: {
				collapseGroup: storage.prefs.get('manage-collapse-group'),
				rulesNoEffectForHe: storage.prefs.get('exclude-he')
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
			},
			imports: {
				loading: false,
				list: []
			}
		};
	},
	computed: {
		testResult: function() {
			if (this.edit.test === "") {
				return "";
			}
			return (data => {
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
					return utils.t('test_invalid_regexp');
				} else if (isMatch === 0) {
					return utils.t('test_mismatch');
				} else if (isMatch === 2) {
					return utils.t('test_exclude');
				}
				if (data.execType == 1) {
					return utils.t('test_custom_code');
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
			})(this.edit);
		},
		groupList: function() {
			return Object.keys(this.group);
		}
	},
	methods: {
		t: utils.t,
		showAlert(text) {
			this.alert.text = text;
			this.alert.show = true;
		},
		showToast(text) {
			this.toast.text = text;
			this.toast.show = true;
		},
		onChooseCancel() {
			this.choosenNewGroup = "";
			this.choosenGroup = "";
			this.isChooseGroup = false;
		},
		onChooseOK() {
			this.isChooseGroup = false;
		},
		chooseGroup() {
			const _this = this;
			return new Promise(resolve => {
				_this.choosenNewGroup = "";
				_this.choosenGroup = utils.t('ungrouped');
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
									collapse: storage.prefs.get('manage-collapse-group'),
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
		showAddPage() {
			this.editTitle = utils.t('add');
			this.isShowEdit = true;
		},
		closeEditPage() {
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
			this.edit.group = utils.t('ungrouped');
		},
		saveRule() {
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
			const table = utils.getTableName(data.ruleType);
			if (data.group === '') {
				data.group = utils.t('ungrouped');
			}
			if (data.name === '') {
				this.showAlert(utils.t('name_empty'));
				return;
			}
			if (data.matchType !== 'all' && data.matchRule === '') {
				this.showAlert(utils.t('match_rule_empty'));
				return;
			}
			if (data.isFunction) {
				data.code = this.edit.code;
				if (data.code === '') {
					this.showAlert(utils.t('code_empty'));
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
						this.showAlert(utils.t('redirect_empty'));
						return;
					}
					data.action = 'redirect';
					data.to = this.edit.redirectTo;
				}
				if ((this.edit.ruleType === 'modifySendHeader' || this.edit.ruleType === 'modifyReceiveHeader')) {
					if (this.edit.headerName === '') {
						this.showAlert(utils.t('header_empty'));
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
			rules.save(table, data).then(function(response) {
				if (_this.edit.id && _this.edit.id !== -1) {
					// Move group if required
					if (_this.edit.oldGroup != data.group) {
						_this.$delete(_this.group[data.group].rule, table + '-' + data.id);
					}
				}
				if (!_this.group[response.group]) {
					_this.$set(_this.group, response.group, {
						name: response.group,
						collapse: storage.prefs.get('manage-collapse-group'),
						rule: {}
					});
				}
				_this.$set(_this.group[response.group].rule, table + '-' + response.id, response);
				browser.runtime.sendMessage({"method": "updateCache", "type": table});
				_this.showToast(utils.t('saved'));
				_this.closeEditPage();
			});
		},
		editRule(rule) {
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
			this.editTitle = utils.t('edit');
			this.isShowEdit = true;
		},
		removeRule(r) {
			const _this = this;
			const table = utils.getTableName(r.ruleType);
			const key = table + '-' + r.id;
			rules.remove(table, r.id).then((response) => {
				browser.runtime.sendMessage({"method": "updateCache", "type": table});
				Object.keys(_this.group).forEach(e => {
					if (typeof(_this.group[e].rule[key]) !== "undefined") {
						_this.$delete(_this.group[e].rule, key);
					}
				});
			});
		},
		// Enable or disable a rule
		onRuleEnable(rule, newValue) {
			const table = utils.getTableName(rule.ruleType);
			window.saveRule(table, rule).then(response => {
				browser.runtime.sendMessage({"method": "updateCache", "type": table});
			});
		},
		changeRuleGroup(rule, newGroup) {
			const _this = this;
			return new Promise(resolve => {
				const table = utils.getTableName(rule.ruleType);
				const oldGroup = rule.group;
				_this.$delete(_this.group[oldGroup].rule, table + '-' + rule.id);
				rule.group = newGroup;
				_this.$set(_this.group[newGroup].rule, table + '-' + rule.id, rule);
				window.saveRule(table, rule).then(function(response) {
					resolve(response);
				});
			});
		},
		onChangeRuleGroup(rule) {
			const _this = this;
			this.chooseGroup()
			.then(r => {
				if (r !== null) {
					_this.changeRuleGroup(rule, r);
				}
			});
		},
		onGroupShare(name) {
			const result = {};
			for (const k of utils.TABLE_NAMES) {
				result[k] = [];
			}
			Object.values(this.group[name].rule).forEach(e => {
				result[utils.getTableName(e.ruleType)].push(e);
			});
			file.save(
				JSON.stringify(rules.createExport(result), null, "\t"),
				utils.getExportName(name)
			);
		},
		onGroupDelete(name) {
			// Delete group, but not delete rules, put all rules to "ungrouped"
			const ungrouped = utils.t('ungrouped');
			if (name === ungrouped) {
				return;
			}
			const _this = this;
			Object.values(this.group[name].rule).forEach(e => {
				_this.changeRuleGroup(e, ungrouped);
			});
			this.$delete(this.group, name);
		},
		onExportAll() {
			const result = {};
			utils.TABLE_NAMES.forEach(k => {
				result[k] = rules.get(k);
			});
			file.save(
				JSON.stringify(rules.createExport(result), null, "\t"),
				utils.getExportName(name)
			);
		},
		onImport() {
			file.load('.json').then(content => {
				this.showImportConfirm(content);
			});
		},
		showImportConfirm(content) {
			this.imports.loading = true;
			try {
				this.imports.list = [];
				const list = rules.fromJson(content);
				utils.TABLE_NAMES.forEach(tableName => {
					if (!list[tableName]) {
						return;
					}
					list[tableName].forEach(e => {
						if (!e.group) {
							e.group = utils.t('ungrouped');
						}
						e.id = Math.random();
						const rule = rules.get(tableName, { "name": e.name });
						e.import_action = 1;
						if (rule.length) {
							e.import_action = 2;
							e.import_old_id = rule[0].id;
						}
						this.imports.list.push(e);
					});
				});
			} catch (e) {
				console.log(e);
				this.imports.loading = false;
				return;
			}
			this.imports.loading = false;
		}
	},
	mounted() {
		const _this = this;
		// Load rules
		(function() {
			_this.$set(_this.group, utils.t('ungrouped'), {
				name: utils.t('ungrouped'),
				collapse: storage.prefs.get('manage-collapse-group'),
				rule: {}
			});
			function appendRule(table, response) {
				for (const item of response) {
					if (typeof(_this.group[item.group]) === "undefined") {
						_this.$set(_this.group, item.group, {
							name: item.group,
							collapse: storage.prefs.get('manage-collapse-group'),
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
					checkResult(table, rules.get(table));
				}, 20);
			}
			for (const t of utils.TABLE_NAMES) {
				requestRules(t);
			}
		})();
		// Load download history
		(function() {
			storage.getLocalStorage().get('dl_history').then(r => {
				if (r.dl_history === undefined) {
					return;
				}
				_this.$set(_this.download, 'log', r.dl_history);
			});
		})();
		this.$watch('options', (newOpt) => {
			storage.prefs.set('manage-collapse-group', newOpt.collapseGroup);
			storage.prefs.set('exclude-he', newOpt.rulesNoEffectForHe);
		}, { deep: true });
	}
}
</script>
