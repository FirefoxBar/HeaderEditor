let waitToImport = null;
let cachedGroupList = {};
let templateId = 1; // used by template

function loadRulesList() {
	function appendRule(type, response) {
		for (var i = 0; i < response.length; i++) {
			let newNode = template.rule.cloneNode(true);
			newNode.setAttribute('data-id', response[i].id);
			newNode.setAttribute('data-table', type);
			newNode.setAttribute('data-type', response[i].ruleType);
			newNode.querySelector('.name').appendChild(document.createTextNode(response[i].name));
			newNode.querySelector('.rule-type').appendChild(document.createTextNode(t('rule_' + response[i].ruleType)));
			newNode.querySelector('.pattern').appendChild(document.createTextNode(response[i].pattern));
			newNode.querySelector('.match-type').appendChild(document.createTextNode(t('match_' + response[i].matchType)));
			newNode.querySelector('.move-group').addEventListener('click', onMoveGroupClick);
			newNode.querySelector('.edit').addEventListener('click', onEditRuleClick);
			newNode.querySelector('.remove').addEventListener('click', onRemoveRuleClick);
			newNode.querySelector('input[name="enable"]').addEventListener('change', onEnableRuleChange);
			if (response[i].enable) {
				newNode.querySelector('.enable input[type="checkbox"]').checked = true;
			}
			moveItemToGroup(newNode, response[i].id, findItemInGroup(response[i].id, type), type);
		}
	}
	function checkResult(type, response) {
		if (!response) { // Firefox is starting up
			requestRules(type);
			return;
		}
		appendRule(type, response);
	}
	function requestRules(type) {
		setTimeout(() => {
			checkResult(type, getRules(type));
		}, 20);
	}
	for (let t of tableNames) {
		requestRules(t);
	}
}

function ruleType2tableName(ruleType) {
	if (ruleType === 'cancel' || ruleType === 'redirect') {
		return 'request';
	}
	if (ruleType === 'modifySendHeader') {
		return 'sendHeader';
	}
	if (ruleType === 'modifyReceiveHeader') {
		return 'receiveHeader';
	}
}

function clearModal() {
	$('#ruleId').val('');
	$('#addDialog').find('input[type="text"]').val('');
	$('#addDialog').find('textarea').val('');
	$('#ruleType').find('option').removeAttr('selected');
	$('#matchType').find('option').removeAttr('selected');
	$('#isFunction').find('option').removeAttr('selected');
	$('#ruleType').removeAttr('disabled');
}

$('#addRule').bind('click', function() {
	clearModal();
	$('#addDialog').find('.modal-title').html(t('add'));
	$('#addDialog').modal('show');
	$('#ruleType').trigger('change');
	$('#isFunction').trigger('change');
	$('#matchType').trigger('change');
});
$('#ruleType').bind('change', function() {
	$('#addDialog').attr('data-type', $(this).find('option:selected').val());
});
$('#isFunction').bind('change', function() {
	$('#addDialog').attr('data-isfunction', $(this).find('option:selected').val());
});
$('#matchType').bind('change', function() {
	$('#addDialog').attr('data-match', $(this).find('option:selected').val());
});
//edit
function onEditRuleClick() {
	var id = $(this).parents('tr').attr('data-id');
	var table = ruleType2tableName($(this).parents('tr').attr('data-type'));
	clearModal();
	$('#addDialog').find('.modal-title').html(t('edit'));
	var rule = getRules(table, {"id": id})[0];
	$('#ruleId').val(id);
	$('#name').val(rule.name);
	$('#matchRule').val(rule.pattern);
	$('#excludeRule').val(rule.exclude ? rule.exclude : '');
	$('#ruleType').find('option[value="' + rule.ruleType + '"]').prop('selected', true);
	$('#ruleType').attr('disabled', 'true');
	$('#matchType').find('option[value="' + rule.matchType + '"]').prop('selected', true);
	$('#isFunction').find('option[value="' + rule.isFunction + '"]').prop('selected', true);
	if (rule.isFunction) {
		$('#custom-code').val(rule.code);
	} else {
		if (rule.ruleType === 'redirect') {
			$('#redirectTo').val(rule.to);
		}
		if (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') {
			$('#headerName').val(rule.action.name);
			$('#headerValue').val(rule.action.value);
		}
	}
	$('#ruleType').trigger('change');
	$('#isFunction').trigger('change');
	$('#matchType').trigger('change');
	$('#addDialog').modal('show');
}
//remove
function onRemoveRuleClick() {
	var tr = $(this).parents('tr');
	var id = tr.attr('data-id');
	var table = ruleType2tableName(tr.attr('data-type'));
	deleteRule(table, id).then((response) => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
		tr.remove();
	});
}
//enable or disable
function onEnableRuleChange () {
	var tr = $(this).parents('tr');
	var id = tr.attr('data-id');
	var table = ruleType2tableName(tr.attr('data-type'));
	var enable = this.checked ? 1 : 0;
	saveRule(table, {"id": id, "enable": enable}).then(() => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
	});
}
//save rule
function onSaveClick() {
	//check
	var name = $('#name').val().trim();
	var ruleType = $('#ruleType').find('option:selected').val();
	var matchType = $('#matchType').find('option:selected').val();
	var matchRule = $('#matchRule').val().trim();
	var redirectTo = $('#redirectTo').val().trim();
	var headerName = $('#headerName').val().trim();
	var headerValue = $('#headerValue').val().trim();
	var ruleId = $('#ruleId').val();
	var exclude = $('#excludeRule').val();
	var isFunction = parseInt($('#isFunction').find('option:selected').val());
	var code = $('#custom-code').val();
	if (name === '') {
		alert(t('name_empty'));
		return;
	}
	if (matchType !== 'all' && matchRule === '') {
		alert(t('match_rule_empty'));
		return;
	}
	if (isFunction) {
		if (code === '') {
			alert(t('code_empty'));
			return;
		}
	} else {
		if (ruleType === 'redirect' && redirectTo === '') {
			alert(t('redirect_empty'));
			return;
		}
		if ((ruleType === 'modifySendHeader' || ruleType === 'modifyReceiveHeader') && headerName === '') {
			alert(t('header_empty'));
			return;
		}
	}
	//make save data
	var SaveData = {
		"enable": 1,
		"name": name,
		"ruleType": ruleType,
		"matchType": matchType,
		"pattern": matchRule,
		"exclude": exclude,
		"isFunction": isFunction
	};
	var SaveTable = ruleType2tableName(ruleType);
	if (ruleType === 'cancel') {
		SaveData.action = 'cancel';
	}
	if (SaveData.isFunction) {
		SaveData.code = code;
		// test code
		try {
			new Function('val', 'detail', code);
		} catch (e) {
			alert(e.message);
			return;
		}
	} else {
		if (ruleType === 'redirect') {
			SaveData.action = 'redirect';
			SaveData.to = redirectTo;
		}
		if (ruleType === 'modifySendHeader' || ruleType === 'modifyReceiveHeader') {
			SaveData.action = {
				"name": headerName,
				"value": headerValue
			};
		}
	}
	if (ruleId !== '') {
		SaveData.id = ruleId;
	}
	saveRule(SaveTable, SaveData).then(function(response) {
		$('#addDialog').modal('hide');
		browser.runtime.sendMessage({"method": "updateCache", "type": SaveTable});
		setTimeout(() => {
			window.location.reload();
		}, 300);
	});
}
//export
function onExportClick() {
	var allResult = {};
	saveAsFile(JSON.stringify(browser.extension.getBackgroundPage().cachedRules), 'headereditor-' + new Date().getTime().toString() + '.json');
}
//import
function importFromString(str) {
	waitToImport = {};
	content = JSON.parse(str);
	for (let key of tableNames) {
		waitToImport[key] = [];
	}
	for (let key of tableNames) {
		for (let item of content[key]) {
			delete item.id;
			if (typeof(item.isFunction) === 'undefined') {
				item.matchType = item.type;
				item.isFunction = 0;
				delete item.type;
			}
			if (typeof(item.enable) === 'undefined') {
				item.enable = 1;
			}
			waitToImport[key].push(item);
		}
	}
	showImportModal();
}
function onImportClick() {
	loadFromFile('.json').then(function(content) {
		importFromString(content);
	});
}
function showImportModal() {
	const tbody = document.getElementById('importRulesList');
	tbody.innerHTML = '';
	for (let key of tableNames) {
		for (const id in waitToImport[key]) {
			const item = waitToImport[key][id];
			const elementId = key + '-' + id;
			let n = template.importRule.cloneNode(true);
			n.setAttribute('id', elementId);
			n.querySelector('.name').appendChild(document.createTextNode(item.name));
			n.querySelector('.rule-type').appendChild(document.createTextNode(t('rule_' + item.ruleType)));
			n.querySelectorAll('input[type="radio"]').forEach((e) => {
				e.setAttribute('name', elementId);
			});
			let rules = getRules(key, {"name": item.name});
			if (rules.length) {
				n.setAttribute('data-oldid', rules[0].id);
				n.classList.add('keep');
				n.querySelector('input[value="new"]').checked = true;
			} else {
				n.classList.add('new');
				n.querySelector('input[value="yes"]').checked = true;
			}
			tbody.appendChild(n);
		}
	}
	$('#importDialog').modal('show');
}
function onImportSubmit() {
	let total = 0;
	let finish = 0;
	let toSave = {};
	function checkFinish() {
		if (total === finish) {
			$('#importDialog').modal('hide');
			browser.runtime.sendMessage({"method": "updateCache", "type": "all"});
			setTimeout(() => {
				window.location.reload();
			}, 500);
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
	};
	for (let key of tableNames) {
		for (const item of toSave[key]) {
			saveRule(key, item).then(() => {
				finish++;
				checkFinish();
			});
		}
	}
}

function onBatchModeClick() {
	document.querySelectorAll('.rule-list').forEach((e) => {
		e.classList.toggle('batch-mode');
	});
	document.querySelector('.batch-mode-btns').classList.toggle('show');
}
function onBatchSelectAll() {
	if (!document.querySelector('input[name="batch"]')) {
		return;
	}
	let setTo = document.querySelector('input[name="batch"]').checked ? false : true;
	document.querySelectorAll('input[name="batch"]').forEach((e) => {
		e.checked = setTo;
	});
}
function onBatchDeleteClick() {
	let all = document.querySelectorAll('input[name="batch"]:checked');
	let total = all.length;
	let ok = 0;
	all.forEach((e) => {
		let tr = findParent(e, (c) => { return c.nodeName.toLowerCase() === 'tr'; });
		let id = tr.getAttribute('data-id');
		let table = tr.getAttribute('data-table');
		deleteRule(table, id).then((response) => {
			browser.runtime.sendMessage({"method": "updateCache", "type": table});
			tr.remove();
			ok++;
			if (ok === total) {
				onBatchDeleteClick();
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
	saveAsFile(JSON.stringify(result, null, "\t"), 'headereditor-' + new Date().getTime().toString() + '.json');
}
function onBatchGroupClick() {
	this.nextElementSibling.innerHTML = document.getElementById('move_to_group').innerHTML;
	this.nextElementSibling.querySelectorAll('li').forEach((e) => {
		e.addEventListener('click', onBatchGroupMenuClick);
	});
}
function onBatchGroupMenuClick() {
	let name = '';
	if (this.getAttribute('data-name') === '_new') {
		name = window.prompt(t('enter_group_name'));
		if (name) {
			addGroupEl(name);
			cachedGroupList[name] = [];
			saveGroups();
		} else {
			return;
		}
	} else {
		name = this.getAttribute('data-name');
	}
	document.querySelectorAll('input[name="batch"]:checked').forEach((e) => {
		let el = findParent(e, (c) => { return c.nodeName.toLowerCase() === 'tr'; });
		moveItemToGroup(el, el.getAttribute('data-id'), name, el.getAttribute('data-table'));
	});
}
function onBatchGroupSelect() {
	const p = findParent(this, (e) => { return e.classList.contains('group-item'); });
	if (!p.querySelector('input[name="batch"]')) {
		return;
	}
	let setTo = p.querySelector('input[name="batch"]').checked ? false : true;
	p.querySelectorAll('input[name="batch"]').forEach((e) => {
		e.checked = setTo;
	});
}

function downloadRule(url) {
	getURL(url).then((str) => {
		importFromString(str);
	});
}

function loadDownloadHistory() {
	if (!localStorage.getItem('dl_history')) {
		localStorage.setItem('dl_history', '[]');
		return;
	}
	let h = JSON.parse(localStorage.getItem('dl_history'));
	const dl_history_box = document.getElementById('download-history');
	dl_history_box.innerHTML = '';
	for (const url of h) {
		let n = template.dlHistory.cloneNode(true);
		n.querySelector('.url').setAttribute('data-url', url);
		n.querySelector('.url').appendChild(document.createTextNode(url));
		n.querySelector('.download').addEventListener('click', onHistoryDownload);
		n.querySelector('.edit').addEventListener('click', onHistoryEdit);
		n.querySelector('.remove').addEventListener('click', onHistoryRemove);
		dl_history_box.appendChild(n);
	}
}
function onHistoryDownload() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	downloadRule(url);
}
function onHistoryEdit() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	document.getElementById('download-url').value = url;
	document.getElementById('download-url').focus();
}
function onHistoryRemove() {
	const url = this.parentElement.parentElement.querySelector('.url').getAttribute('data-url');
	let h = JSON.parse(localStorage.getItem('dl_history'));
	for (const index in h) {
		if (h[index] === url) {
			h.splice(index, 1);
			break;
		}
	}
	localStorage.setItem('dl_history', JSON.stringify(h));
	loadDownloadHistory();
}
function addHistory(url) {
	let h = JSON.parse(localStorage.getItem('dl_history'));
	if (!h.includes(url)) {
		h.push(document.getElementById('download-url').value);
		localStorage.setItem('dl_history', JSON.stringify(h));
		loadDownloadHistory();
	}
}


function onMoveGroupClick() {
	this.nextElementSibling.innerHTML = document.getElementById('move_to_group').innerHTML;
	this.nextElementSibling.querySelectorAll('li').forEach((e) => {
		e.addEventListener('click', onGroupMenuClick);
	});
}
function onGroupMenuClick() {
	let name = '';
	let el = findParent(this, (e) => { return e.nodeName.toLowerCase() === 'tr'; });
	if (this.getAttribute('data-name') === '_new') {
		name = window.prompt(t('enter_group_name'));
		if (name) {
			addGroupEl(name);
			cachedGroupList[name] = [];
			saveGroups();
		} else {
			return;
		}
	} else {
		name = this.getAttribute('data-name');
	}
	// move to
	moveItemToGroup(el, el.getAttribute('data-id'), name, el.getAttribute('data-table'));
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
}
function findItemInGroup(id, type) {
	for (let i in cachedGroupList) {
		if (cachedGroupList[i].includes(type + '-' + id)) {
			return i;
		}
	}
	return Object.keys(cachedGroupList)[0];
}
function initGroup() {
	const groupMenu = document.getElementById('move_to_group');
	if (!localStorage.getItem('groups')) {
		cachedGroupList[t('ungrouped')] = [];
		saveGroups();
	}
	cachedGroupList = JSON.parse(localStorage.getItem('groups'));
	Object.keys(cachedGroupList).forEach((e) => {
		addGroupEl(e);
	});
	let n = template.groupMenuList.cloneNode(true);
	n.setAttribute('data-name', '_new');
	n.querySelector('.name').appendChild(document.createTextNode(t('add')));
	groupMenu.appendChild(n);
}
function addGroupEl(name) {
	if (document.querySelector('#groups .group-item[data-name="' + name + '"]') !== null) {
		return;
	}
	const group = document.getElementById('groups');
	const groupMenu = document.getElementById('move_to_group');
	let n = template.groupMenuList.cloneNode(true);
	n.setAttribute('data-name', name);
	n.querySelector('.name').appendChild(document.createTextNode(name));
	groupMenu.insertBefore(n, groupMenu.childNodes[groupMenu.childNodes.length - 1]);
	let n_group = template.groupItem.cloneNode(true);
	n_group.setAttribute('data-name', name);
	n_group.innerHTML = n_group.innerHTML.replace(/\{id\}/g, templateId++);
	n_group.querySelector('.title').appendChild(document.createTextNode(name));
	n_group.querySelector('.share').addEventListener('click', onGroupShareClick);
	n_group.querySelector('.remove').addEventListener('click', onGroupRemoveClick);
	group.appendChild(n_group);
	// select and unselect all
	n_group.querySelector('th.batch').addEventListener('click', onBatchGroupSelect);
}
function saveGroups() {
	localStorage.setItem('groups', JSON.stringify(cachedGroupList));
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
	saveAsFile(JSON.stringify(result, null, "\t"), 'headereditor-' + new Date().getTime().toString() + '.json');
}
function onGroupRemoveClick() {
	const el = findParent(this, (e) => { return e.classList.contains('group-item'); });
	const name = el.getAttribute('data-name');
	if (name === t('ungrouped')) {
		// can not delete default group
		return;
	}
	delete cachedGroupList[name];
	saveGroups();
	window.location.reload();
}


document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('export').addEventListener('click', onExportClick);
	document.getElementById('ruleSave').addEventListener('click', onSaveClick);

	// group
	initGroup();

	// Batch delete
	document.getElementById('batch-mode').addEventListener('click', onBatchModeClick);
	document.getElementById('batch-select-all').addEventListener('click', onBatchSelectAll);
	document.getElementById('batch-delete').addEventListener('click', onBatchDeleteClick);
	document.getElementById('batch-group').addEventListener('click', onBatchGroupClick);
	document.getElementById('batch-share').addEventListener('click', onBatchShareClick);

	// Import rules
	document.getElementById('import').addEventListener('click', onImportClick);
	document.getElementById('importSave').addEventListener('click', onImportSubmit);

	// Download rules
	document.getElementById('download-submit').addEventListener('click', () => {
		downloadRule(document.getElementById('download-url').value);
		addHistory(document.getElementById('download-url').value);
	});
	loadDownloadHistory();

	loadRulesList();
});