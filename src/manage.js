
loadRulesList();
function loadRulesList() {
	$('#rulesList').html('');
	var rulesType = ['request', 'sendHeader', 'receiveHeader'];
	for (var i = 0; i < rulesType.length; i++) {
		browser.runtime.sendMessage({"method": 'getRules', "type": rulesType[i]}).then(function(response) {
			console.log(response);
			for (var i = 0; i < response.length; i++) {
				var text = '<tr data-id="' + response[i].id + '" data-type="' + response[i].ruleType + '"><td>' + response[i].name + '</td><td>' + t('rule_' + response[i].ruleType) + '</td><td>' + response[i].pattern + '</td><td>' + t('match_' + response[i].type) + '</td><td><button class="j_edit btn btn-default"><i class="glyphicon glyphicon-pencil"></i></button><button class="j_remove btn btn-default"><i class="glyphicon glyphicon-remove"></i></button></td></tr>';
				$('#rulesList').append(text);
			}
		});
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

$('#addRule').bind('click', function() {
	$('#addRule').find('input[type="text"]').val('');
	$('#ruleId').val('');
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
	}
	if (ruleType === 'modifySendHeader') {
		SaveData.action = {
			"name": headerName,
			"value": headerValue
		};
	}
	if (ruleType === 'modifyReceiveHeader') {
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
		loadRulesList();
	});
});
//edit
$('#rulesList').on('click', '.j_edit', function() {
	var id = $(this).parents('tr').attr('data-id');
	var table = ruleType2tableName($(this).parents('tr').attr('data-id'));
	browser.runtime.sendMessage({"method": "getRules", "options": {"id": id}, "type": table}).then(function(response) {
		var rule = response[0];
		$('#ruleId').val(id);
		$('#ruleType').find('option[value="' + rule.ruleType + '"]').selected();
		$('#matchType').find('option[value="' + rule.type + '"]').selected();
	});
})