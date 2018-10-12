<template>
	<div class="main">
		<md-tabs class="md-primary main-menu" md-elevation="1" md-active-tab="tab-rule-list">
			<md-tab id="tab-rule-list" :md-label="t('rule_list')" md-icon="list">
				<md-card v-for="g of group" :key="g.name" class="group-item">
					<md-card-header>
						<div class="md-title">{{g.name}}</div>
						<md-button class="md-icon-button" md-direction="bottom-end" @click="g.collapse = !g.collapse">
							<md-icon v-show="!g.collapse">keyboard_arrow_up</md-icon>
							<md-icon v-show="g.collapse">keyboard_arrow_down</md-icon>
						</md-button>
						<md-menu md-size="big" md-direction="bottom-end">
							<md-button class="md-icon-button" md-menu-trigger>
								<md-icon>more_vert</md-icon>
							</md-button>
							<md-menu-content>
								<md-menu-item @click="onGroupRename(g)">
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
					</md-card-header>
					<md-card-content>
						<md-table v-show="!g.collapse">
							<md-table-row>
								<md-table-head class="cell-enable">{{t('enable')}}</md-table-head>
								<md-table-head class="cell-name">{{t('name')}}</md-table-head>
								<md-table-head class="cell-type">{{t('ruleType')}}</md-table-head>
								<md-table-head class="cell-action">{{t('action')}}</md-table-head>
							</md-table-row>
							<md-table-row v-for="r of g.rule" :key="r._v_key">
								<md-table-cell class="cell-enable">
									<md-switch v-model="r.enable" class="md-primary" :data-type="r.ruleType" :data-id="r.id" @change="newValue => onRuleEnable(r, newValue)"></md-switch>
								</md-table-cell>
								<md-table-cell class="cell-name">
									<span>{{r.name}}</span>
									<md-tooltip md-direction="bottom">
										<p>{{t('matchType')}}: {{t('match_' + r.matchType)}}</p>
										<p>{{t('matchRule')}}: {{r.pattern}}</p>
										<p>{{t('exec_type')}}: {{t('exec_' + (r.isFunction ? 'function' : 'normal'))}}</p>
										<p v-if="r.ruleType === 'redirect'">{{t('redirectTo')}}: {{r.to}}</p>
										<p v-if="(r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader') && !r.isFunction">{{t('headerName')}}: {{r.action.name}}</p>
										<p v-if="(r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader') && !r.isFunction">{{t('headerValue')}}: {{r.action.value}}</p>
									</md-tooltip>
								</md-table-cell>
								<md-table-cell class="cell-type">{{t('rule_' + r.ruleType)}}</md-table-cell>
								<md-table-cell class="cell-action">
									<md-button class="with-icon" @click="onChangeRuleGroup(r)"><md-icon>playlist_add</md-icon>{{t('group')}}</md-button>
									<md-button class="with-icon" @click="onEditRule(r)"><md-icon>mode_edit</md-icon>{{t('edit')}}</md-button>
									<md-button class="with-icon" @click="onCloneRule(r)"><md-icon>file_copy</md-icon>{{t('clone')}}</md-button>
									<md-button class="with-icon" @click="onViewRule(r)"><md-icon>search</md-icon>{{t('view')}}</md-button>
									<md-button class="with-icon" @click="onRemoveRule(r)"><md-icon>delete</md-icon>{{t('delete')}}</md-button>
								</md-table-cell>
							</md-table-row>
						</md-table>
					</md-card-content>
				</md-card>
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
						<div class="download-input">
							<md-field md-inline class="url">
								<label>URL</label>
								<md-input v-model="download.url"></md-input>
							</md-field>
							<md-button class="md-icon-button" @click="onDownloadClick"><md-icon>file_download</md-icon></md-button>
							<md-button class="md-icon-button" :title="t('third_party_rules')"><md-icon>search</md-icon></md-button>
						</div>
						<md-list class="download-list">
							<md-list-item v-for="url of download.log" :key="url">
								<span class="md-list-item-text">{{url}}</span>
								<md-button class="md-icon-button md-list-action" @click="onDownloadLogClick(url)"><md-icon>file_download</md-icon></md-button>
								<md-button class="md-icon-button md-list-action" @click="download.url = url"><md-icon>mode_edit</md-icon></md-button>
								<md-button class="md-icon-button md-list-action" @click="onRemoveDownload(url)"><md-icon>delete</md-icon></md-button>
							</md-list-item>
						</md-list>
					</md-card-content>
				</md-card>
				<!-- import list -->
				<md-card class="import-confirm">
					<md-card-area>
						<md-card-header>
							<div class="md-title">{{t('import')}}</div>
						</md-card-header>
						<md-card-content>
							<md-progress-bar md-mode="indeterminate" v-show="imports.status == 1"></md-progress-bar>
							<md-table v-show="imports.status == 2" class="import-table">
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
										<span>{{r.group}}</span>
										<md-button class="md-primary" @click="onImportRuleChooseGroup(r)">{{t('choose')}}</md-button>
									</md-table-cell>
									<md-table-cell class="cell-action">
										<md-radio class="md-primary" v-model="r.import_action" :value="1">{{t('import_new')}}</md-radio>
										<md-radio class="md-primary" v-model="r.import_action" :value="2" v-show="r.import_old_id">{{t('import_override')}}</md-radio>
										<md-radio class="md-primary" v-model="r.import_action" :value="3">{{t('import_drop')}}</md-radio>
									</md-table-cell>
								</md-table-row>
							</md-table>
						</md-card-content>
					</md-card-area>
					<md-card-actions md-alignment="left" v-show="imports.status == 2">
						<div class="save-to">
							<span>{{t('save_to')}}</span>
							<md-radio class="md-primary" v-model="imports.group_type" :value="0">{{imports.group_name}}<md-button class="md-primary" @click="onImportChooseGroup">{{t('choose')}}</md-button></md-radio>
							<md-radio class="md-primary" v-model="imports.group_type" :value="1">{{t('suggested_group')}}</md-radio>
						</div>
						<md-button @click="onImportSave">{{t('save')}}</md-button>
						<md-button @click="imports.status = 0">{{t('cancel')}}</md-button>
					</md-card-actions>
				</md-card>
			</md-tab>
			<md-tab id="tab-help" :md-label="t('help')" md-icon="live_help">
				<md-button @click="onOpenHelp" class="with-icon"><md-icon>open_in_new</md-icon>{{t('view')}}</md-button>
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
									<md-radio class="md-primary" v-model="edit.ruleType" value="cancel" :disabled="!edit.ruleTypeEditable">{{t('rule_cancel')}}</md-radio>
									<md-radio class="md-primary" v-model="edit.ruleType" value="redirect" :disabled="!edit.ruleTypeEditable">{{t('rule_redirect')}}</md-radio>
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
							<p class="group">
								<span>{{t('group')}}</span><span>{{edit.group}}</span>
								<md-button class="md-primary" @click="onEditChooseGroup">{{t('choose')}}</md-button>
							</p>
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
		<div class="drags">
			<md-card class="rule-drag-view dragbox" v-for="r of dragable_rule" :key="r._v_key">
				<md-card-area>
					<md-card-header>
						<div class="md-title">{{r.name}}</div>
					</md-card-header>
					<md-card-content>
						<p>{{t('matchType')}}: {{t('match_' + r.matchType)}}</p>
						<p>{{t('matchRule')}}: {{r.pattern}}</p>
						<p>{{t('exec_type')}}: {{t('exec_' + (r.isFunction ? 'function' : 'normal'))}}</p>
						<p v-if="r.ruleType === 'redirect'">{{t('redirectTo')}}: {{r.to}}</p>
						<p v-if="(r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader') && !r.isFunction">{{t('headerName')}}: {{r.action.name}}</p>
						<p v-if="(r.ruleType === 'modifySendHeader' || r.ruleType === 'modifyReceiveHeader') && !r.isFunction">{{t('headerValue')}}: {{r.action.value}}</p>
						<pre v-if="r.isFunction">{{r.code}}</pre>
					</md-card-content>
				</md-card-area>
				<md-card-actions md-alignment="left">
					<md-button class="md-icon-button" @mousedown="e => onDragStart(e, r)" @touchstart="e => onDragStart(e, r)" style="cursor:move"><md-icon>open_with</md-icon></md-button>
					<md-button class="md-primary" @click="dragable_rule.splice(dragable_rule.indexOf(r), 1)">{{t('close')}}</md-button>
				</md-card-actions>
			</md-card>
		</div>
		<md-dialog :md-active.sync="isChooseGroup" class="group-dialog">
			<md-dialog-title>{{t('group')}}</md-dialog-title>
			<md-list>
				<md-list-item v-for="g of groupList" :key="g">
					<md-radio v-model="choosenGroup" :value="g" />
					<span class="md-list-item-text">{{g}}</span>
				</md-list-item>
				<md-list-item class="md-radio-input new">
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
import merge from 'merge';
import parsePath from 'parse-path';
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
				collapseGroup: true,
				rulesNoEffectForHe: true
			},
			download: {
				url: "",
				log: []
			},
			activeTab: 0,
			group: {},
			choosenGroup: "",
			choosenNewGroup: "",
			dragable_rule: [],
			alert: {
				show: false,
				text: ""
			},
			toast: {
				show: false,
				text: ""
			},
			imports: {
				status: 0,
				group_type: 0,
				group_name: "",
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
							const reg = new RegExp(data.matchRule, 'g');
							isMatch = reg.test(data.test) ? 1 : 0;
						} catch (e) {
							isMatch = -1;
						}
						break;
					case 'prefix':
						isMatch = data.test.indexOf(data.matchRule) === 0 ? 1 : 0;
						break;
					case 'domain':
						isMatch = parsePath(data.test).resource === data.matchRule ? 1 : 0;
						break;
					case 'url':
						isMatch = data.test === data.matchRule ? 1 : 0;
						break;
					default:
						break;
				}
				if (isMatch === 1 && typeof(data.matchRule) === 'string' && data.excludeRule.length > 0) {
					try {
						const reg = new RegExp(data.excludeRule);
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
		loadRules() {
			const _this = this;
			this.group = {};
			this.$set(this.group, utils.t('ungrouped'), {
				name: utils.t('ungrouped'),
				collapse: this.options.collapseGroup,
				rule: {}
			});
			function appendRule(table, response) {
				response.forEach(item => {
					if (typeof(_this.group[item.group]) === "undefined") {
						_this.$set(_this.group, item.group, {
							name: item.group,
							collapse: _this.options.collapseGroup,
							rule: {}
						});
					}
					item["_v_key"] = table + '-' + item.id;
					_this.$set(_this.group[item.group].rule, item["_v_key"], item);
				});
			}
			function checkResult(table, response) {
				if (!response) { // Browser is starting up
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
			utils.TABLE_NAMES.forEach(t => requestRules(t));
		},
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
		chooseGroup(name) {
			const _this = this;
			return new Promise(resolve => {
				_this.choosenNewGroup = "";
				_this.choosenGroup = name ? name : utils.t('ungrouped');
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
			const data = {
				"enable": true,
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
			rules.save(table, data).then(response => {
				const v_key = table + '-' + response.id;
				if (this.edit.id && this.edit.id !== -1) {
					// Move group if required
					if (this.edit.oldGroup != data.group) {
						this.$delete(this.group[data.group].rule, v_key);
					}
				}
				if (!this.group[response.group]) {
					this.$set(this.group, response.group, {
						name: response.group,
						collapse: storage.prefs.get('manage-collapse-group'),
						rule: {}
					});
				}
				response._v_key = v_key;
				this.$set(this.group[response.group].rule, v_key, response);
				browser.runtime.sendMessage({"method": "updateCache", "type": table});
				this.showToast(utils.t('saved'));
				this.closeEditPage();
			});
		},
		onEditRule(rule) {
			console.log(rule);
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
		onCloneRule(r) {
			const newName = window.prompt(utils.t('name'), r.name + "_clone");
			if (newName) {
				const newRule = merge(true, r);
				const tableName = utils.getTableName(r.ruleType);
				newRule.name = newName;
				delete newRule["id"];
				rules.save(tableName, newRule)
				.then(res => {
					browser.runtime.sendMessage({"method": "updateCache", "type": tableName});
					this.$set(this.group[res.group].rule, tableName + '-' + res.id, res);
				})
			}
		},
		onViewRule(r) {
			if (!this.dragable_rule.includes(r)) {
				this.dragable_rule.push(r);
			}
		},
		onEditChooseGroup() {
			this.chooseGroup(this.edit.group)
			.then(r => {
				if (r !== null) {
					this.edit.group = r;
				}
			});
		},
		onRemoveRule(r) {
			const table = utils.getTableName(r.ruleType);
			const key = table + '-' + r.id;
			rules.remove(table, r.id).then(response => {
				browser.runtime.sendMessage({"method": "updateCache", "type": table});
				Object.keys(this.group).forEach(e => {
					if (typeof(this.group[e].rule[key]) !== "undefined") {
						this.$delete(this.group[e].rule, key);
					}
				});
			});
		},
		// Enable or disable a rule
		onRuleEnable(rule, newValue) {
			const table = utils.getTableName(rule.ruleType);
			rules.save(table, rule).then(response => {
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
				rules.save(table, rule).then(function(response) {
					resolve(response);
				});
			});
		},
		onChangeRuleGroup(rule) {
			this.chooseGroup()
			.then(r => {
				if (r !== null) {
					this.changeRuleGroup(rule, r);
				}
			});
		},
		onGroupRename(g) {
			const name = window.prompt(utils.t('name'), g.name);
			if (name) {
				const queue = [];
				Object.values(g.rule).forEach(r => {
					r.group = name;
					queue.push(rules.save(utils.getTableName(r.ruleType), r));
				});
				Promise.all(queue).then(() => {
					g.name = name;
				});
			}
		},
		onGroupShare(name) {
			const result = {};
			utils.TABLE_NAMES.forEach(t => {
				result[k] = [];
			});
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
			Object.values(this.group[name].rule).forEach(e => {
				this.changeRuleGroup(e, ungrouped);
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
		onImportRuleChooseGroup(rule) {
			this.chooseGroup(rule.group)
			.then(r => {
				if (r !== null) {
					rule.group = r;
				}
			});
		},
		onImportChooseGroup() {
			this.chooseGroup(this.imports.group_name)
			.then(r => {
				if (r !== null) {
					this.imports.group_name = r;
				}
			});
		},
		onImportSave() {
			this.imports.status = 1;
			const queue = [];
			this.imports.list.forEach(e => {
				//不导入
				if (e.import_action == 3) {
					return;
				}
				if (e.import_action == 2) {
					e.id = e.import_old_id;
				} else {
					delete e["id"];
				}
				delete e["import_action"];
				delete e["import_old_id"];
				const tableName = utils.getTableName(e.ruleType);
				e.group = this.imports.group_type === 0 ? this.imports.group_name : e.group;
				e.enable = true;

				queue.push(rules.save(tableName, e));
			});
			Promise.all(queue).then(() => {
				this.imports.status = 0;
				this.showToast(utils.t('import_success'));
				const t = setTimeout(() => {
					this.loadRules();
					clearTimeout(t);
				}, 300);
			});
		},
		showImportConfirm(content) {
			this.imports.status = 1;
			this.imports.group_name = utils.t('ungrouped');
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
				this.imports.status = 0;
				return;
			}
			this.imports.status = 2;
		},
		saveDownloadHistory() {
			storage.getLocalStorage().set({
				dl_history: JSON.stringify(this.download.log)
			});
		},
		onDownloadClick() {
			this.imports.status = 1;
			if (!this.download.log.includes(this.download.url)) {
				this.download.log.push(this.download.url);
				this.saveDownloadHistory();
			}
			utils.getURL(this.download.url)
			.then(r => {
				this.showImportConfirm(r);
				this.download.url = "";
			})
			.catch(e => {
				this.showToast(e.message);
				this.imports.status = 0;
			});
		},
		onDownloadLogClick(url) {
			this.imports.status = 1;
			utils.getURL(url)
			.then(r => {
				this.showImportConfirm(r);
			})
			.catch(e => {
				this.showToast(e.message);
				this.imports.status = 0;
			});
		},
		onRemoveDownload(url) {
			if (this.download.log.includes(url)) {
				this.download.log.splice(this.download.log.indexOf(url), 1);
				this.saveDownloadHistory();
			}
		},
		onDragStart(e, r) {
			const isTouch = e instanceof TouchEvent;
			const box = (el => {
				let p = el;
				while (p = p.parentElement) {
					if (p.classList.contains('dragbox')) {
						return p;
					}
				}
			})(e.currentTarget);
			const offset = (el => {
				const rect = el.getBoundingClientRect();
				return {
					top: rect.top,
					left: rect.left
				};
			})(box);
			const last = {
				x: e.pageX || e.touches[0].pageX,
				y: e.pageY || e.touches[0].pageY
			};
			let end = false;
			if (isTouch) {
				function onTouchMove(e) {
					offset.top += e.touches[0].pageY - last.y;
					last.y = e.touches[0].pageY;
					offset.left += e.touches[0].pageX - last.x;
					last.x = e.touches[0].pageX;
				}
				document.addEventListener('touchmove', onTouchMove);
				document.addEventListener('touchend', () => {
					end = true;
					document.removeEventListener('mousemove', onTouchMove);
				});
				document.addEventListener('touchcancel', () => {
					end = true;
					document.removeEventListener('mousemove', onTouchMove);
				});
			} else {
				function onMouseMove(e) {
					offset.top += e.pageY - last.y;
					last.y = e.pageY;
					offset.left += e.pageX - last.x;
					last.x = e.pageX;
				}
				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', () => {
					end = true;
					document.removeEventListener('mousemove', onMouseMove);
				});
			}
			function setNewOffset() {
				box.style.top = offset.top + "px";
				box.style.left = offset.left + "px";
				if (!end) requestAnimationFrame(setNewOffset);
			}
			setNewOffset();
		},
		onOpenHelp() {
			browser.runtime.sendMessage({
				method: "openURL",
				url: "https://github.com/FirefoxBar/HeaderEditor/wiki"
			});
		}
	},
	mounted() {
		// Load download history
		storage.getLocalStorage().get('dl_history').then(r => {
			if (r.dl_history === undefined) {
				return;
			}
			this.$set(this.download, 'log', JSON.parse(r.dl_history));
		});
		storage.prefs.onReady().then(prefs => {
			this.options.collapseGroup = prefs.get('manage-collapse-group');
			this.options.rulesNoEffectForHe = prefs.get('exclude-he');
			this.loadRules();
			this.$watch('options', (newOpt) => {
				storage.prefs.set('manage-collapse-group', newOpt.collapseGroup);
				storage.prefs.set('exclude-he', newOpt.rulesNoEffectForHe);
			}, { deep: true });
		});
	},
	watch: {
		isShowEdit(newVal, oldVal) {
			if (newVal) {
				document.body.style.overflow = "hidden";
			} else {
				document.body.style.overflow = "auto";
			}
		}
	}
}
</script>
