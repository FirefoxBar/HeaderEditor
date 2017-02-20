
loadRulesList();
function loadRulesList() {
	$('#rulesList').html('');
	function appendRule(response) {
		for (var i = 0; i < response.length; i++) {
			var text = '<tr data-id="' + response[i].id + '" data-type="' + response[i].ruleType + '"><td>' + response[i].name + '</td><td>' + t('rule_' + response[i].ruleType) + '</td><td>' + response[i].pattern + '</td><td>' + t('match_' + response[i].type) + '</td><td><button class="j_edit btn btn-default"><i class="glyphicon glyphicon-pencil"></i></button><button class="j_remove btn btn-default"><i class="glyphicon glyphicon-remove"></i></button></td></tr>';
			$('#rulesList').append(text);
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
		browser.runtime.sendMessage({"method": 'getRules', "type": type}).then(function(response){
			checkResult(type, response);
		});
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
	$('#ruleType').find('option').removeAttr('selected');
	$('#matchType').find('option').removeAttr('selected');
	$('#ruleType').removeAttr('disabled');
}

$('#addRule').bind('click', function() {
	clearModal();
	$('#addDialog').find('.modal-title').html(t('add'));
	$('#addDialog').modal('show');
	$('#ruleType').trigger('change');
});
$('#ruleType').bind('change', function() {
	var selectedVal = $(this).find('option:selected').val();
	if (selectedVal !== 'redirect') {
		$('#addDialog').find('.redirect_to').hide();
	} else {
		$('#addDialog').find('.redirect_to').show();
	}
	if (selectedVal !== 'modifySendHeader' && selectedVal !== 'modifyReceiveHeader') {
		$('#addDialog').find('.header_mondify').hide();
	} else {
		$('#addDialog').find('.header_mondify').show();
	}
});
//save rule
$('#ruleSave').bind('click', function() {
	//check
	var name = $('#name').val().trim();
	var ruleType = $('#ruleType').find('option:selected').val();
	var matchType = $('#matchType').find('option:selected').val();
	var matchRule = $('#matchRule').val().trim();
	var redirectTo = $('#redirectTo').val().trim();
	var headerName = $('#headerName').val().trim();
	var headerValue = $('#headerValue').val().trim();
	var ruleId = $('#ruleId').val();
	if (name === '') {
		alert('Name is empty');
		return;
	}
	if (matchRule === '') {
		alert('Match rule is empty');
		return;
	}
	if (ruleType === 'redirect' && redirectTo === '') {
		alert('Redirect to is empty');
		return;
	}
	if ((ruleType === 'modifySendHeader' || ruleType === 'modifyReceiveHeader') && (headerName === '' || headerValue === '')) {
		alert('Header name or Header value is empty');
		return;
	}
	//make save data
	var SaveData = {
		"name": name,
		"ruleType": ruleType,
		"type": matchType,
		"pattern": matchRule
	};
	var SaveTable = ruleType2tableName(ruleType);
	if (ruleType === 'cancel') {
		SaveData.action = 'cancel';
	}
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
	if (ruleId !== '') {
		SaveData.id = ruleId;
	}
	browser.runtime.sendMessage({"method": "saveRule", "type": SaveTable, "content": SaveData}).then(function(response) {
		$('#addDialog').modal('hide');
		var _t = setTimeout(function() {
			loadRulesList();
			clearTimeout(_t);
			_t = null;
		}, 300);
	});
});
//edit
$('#rulesList').on('click', '.j_edit', function() {
	var id = $(this).parents('tr').attr('data-id');
	var table = ruleType2tableName($(this).parents('tr').attr('data-type'));
	browser.runtime.sendMessage({"method": "getRules", "options": {"id": id}, "type": table}).then(function(response) {
		clearModal();
		$('#addDialog').find('.modal-title').html(t('edit'));
		var rule = response[0];
		$('#ruleId').val(id);
		$('#name').val(rule.name);
		$('#matchRule').val(rule.pattern);
		$('#ruleType').find('option[value="' + rule.ruleType + '"]').prop('selected', true);
		$('#ruleType').attr('disabled', 'true');
		$('#matchType').find('option[value="' + rule.type + '"]').prop('selected', true);
		if (rule.ruleType === 'redirect') {
			$('#redirectTo').val(rule.to);
		}
		if (ruleType === 'modifySendHeader' || ruleType === 'modifyReceiveHeader') {
			$('#headerName').val(rule.action.name);
			$('#headerValue').val(rule.action.value);
		}
		$('#ruleType').trigger('change');
		$('#addDialog').modal('show');
	});
})