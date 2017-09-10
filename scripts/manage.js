["forEach", "some", "indexOf", "map"].forEach((method) => {
	if (typeof(NodeList.prototype[method]) === 'undefined') {
		NodeList.prototype[method]= Array.prototype[method];
	}
});

function loadRulesList() {
	let ruleList = document.getElementById('rulesList');
	ruleList.innerHTML = '';
	function appendRule(response) {
		for (var i = 0; i < response.length; i++) {
			let newNode = template.rule.cloneNode(true);
			newNode.setAttribute('data-id', response[i].id);
			newNode.setAttribute('data-type', response[i].ruleType);
			newNode.querySelector('.name').appendChild(document.createTextNode(response[i].name));
			newNode.querySelector('.rule-type').appendChild(document.createTextNode(t('rule_' + response[i].ruleType)));
			newNode.querySelector('.pattern').appendChild(document.createTextNode(response[i].pattern));
			newNode.querySelector('.match-type').appendChild(document.createTextNode(t('match_' + response[i].matchType)));
			if (response[i].enable) {
				newNode.querySelector('.enable input[type="checkbox"]').checked = true;
			}
			ruleList.appendChild(newNode);
		}
	}
	function checkResult(type, response) {
		if (!response) { // Firefox is starting up
			requestRules(type);
			return;
		}
		appendRule(response);
	}
	function requestRules(type) {
		setTimeout(() => {
			checkResult(type, getRules(type));
		}, 20);
	}
	requestRules('request');
	requestRules('sendHeader');
	requestRules('receiveHeader');
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
$('#rulesList').on('click', '.j_edit', function() {
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
});
//remove
$('#rulesList').on('click', '.j_remove', function() {
	var tr = $(this).parents('tr');
	var id = tr.attr('data-id');
	var table = ruleType2tableName(tr.attr('data-type'));
	deleteRule(table, id).then((response) => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
		tr.remove();
	});
});
//enable or disable
$('#rulesList').on('change', 'input[name="enable"]', function() {
	var tr = $(this).parents('tr');
	var id = tr.attr('data-id');
	var table = ruleType2tableName(tr.attr('data-type'));
	var enable = this.checked ? 1 : 0;
	saveRule(table, {"id": id, "enable": enable}).then(() => {
		browser.runtime.sendMessage({"method": "updateCache", "type": table});
	});
});
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
			new Function('val', code);
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
		var _t = setTimeout(function() {
			loadRulesList();
			clearTimeout(_t);
			_t = null;
		}, 300);
	});
}
//export
function onExportClick() {
	var allResult = {};
	browser.runtime.getBackgroundPage().then((page) => {
		saveAsFile(JSON.stringify(page.cachedRules), 'headereditor-' + new Date().getTime().toString() + '.json');
	});
}
//import
function onImportClick() {
	var total = 0;
	var finish = 0;
	function checkFinish() {
		if (total === finish) {
			browser.runtime.sendMessage({"method": "updateCache", "type": "all"});
			setTimeout(() => {
				window.location.reload();
			}, 500);
		}
	}
	loadFromFile('.json').then(function(content) {
		content = JSON.parse(content);
		const types = ['request', 'sendHeader', 'receiveHeader'];
		for (let key of types) {
			total += content[key].length;
		}
		for (let key of types) {
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
				saveRule(key, item).then(() => {
					finish++;
					checkFinish();
				});
			}
		}
	});
}

function onBatchDeleteClick() {
	document.querySelector('.rule-list').classList.toggle('batch-del-mode');
	document.querySelector('.batch-delete-btns').classList.toggle('show');
}
function onBatchDeleteSelectAll() {
	if (!document.querySelector('input[name="delete"]')) {
		return;
	}
	let setTo = document.querySelector('input[name="delete"]').checked ? false : true;
	document.querySelectorAll('input[name="delete"]').forEach((e) => {
		e.checked = setTo;
	});
}
function onBatchDeleteSubmit() {
	let all = document.querySelectorAll('input[name="delete"]:checked');
	let total = all.length;
	let ok = 0;
	all.forEach((e) => {
		let tr = $(e).parents('tr');
		let id = tr.attr('data-id');
		let table = ruleType2tableName(tr.attr('data-type'));
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

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('import').addEventListener('click', onImportClick);
	document.getElementById('export').addEventListener('click', onExportClick);
	document.getElementById('ruleSave').addEventListener('click', onSaveClick);

	// Batch delete
	document.getElementById('batch-delete').addEventListener('click', onBatchDeleteClick);
	document.getElementById('batch-delete-all').addEventListener('click', onBatchDeleteSelectAll);
	document.getElementById('batch-delete-submit').addEventListener('click', onBatchDeleteSubmit);

	loadRulesList();
});