const tables = ['request', 'sendHeader', 'receiveHeader'];
let waitToImport = null;

["forEach", "some", "indexOf", "map"].forEach((method) => {
	if (typeof(NodeList.prototype[method]) === 'undefined') {
		NodeList.prototype[method]= Array.prototype[method];
	}
});


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
//get url params
function getParams() {
	var params = {};
	var urlParts = location.href.split("?", 2);
	if (urlParts.length == 1) {
		return params;
	}
	urlParts[1].split("&").forEach((keyValue) => {
		var splitKeyValue = keyValue.split("=", 2);
		params[decodeURIComponent(splitKeyValue[0])] = decodeURIComponent(splitKeyValue[1]);
	});
	return params;
}
function getDomains(url) {
	if (url.indexOf("file:") == 0) {
		return [];
	}
	var d = /.*?:\/*([^\/:]+)/.exec(url)[1];
	var domains = [d];
	while (d.indexOf(".") != -1) {
		d = d.substring(d.indexOf(".") + 1);
		domains.push(d);
	}
	return domains;
}

$('#ruleType').bind('change', function() {
	$('#addDialog').attr('data-type', $(this).find('option:selected').val());
});
$('#isFunction').bind('change', function() {
	$('#addDialog').attr('data-isfunction', $(this).find('option:selected').val());
});
$('#matchType').bind('change', function() {
	$('#addDialog').attr('data-match', $(this).find('option:selected').val());
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
	saveRule(SaveTable, SaveData).then(function(response) {
		$('#addDialog').modal('hide');
		browser.runtime.sendMessage({"method": "updateCache", "type": SaveTable});
		setTimeout(() => {
			closeSelf();
		}, 300);
	});
}

function closeSelf() {
	browser.tabs.getCurrent().then((tab) => {
		browser.tabs.remove(tab.id);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('ruleSave').addEventListener('click', onSaveClick);
	let params = getParams();
	$('#matchRule').val(getDomains(params.url)[0]);
	$('#ruleType').trigger('change');
	$('#isFunction').trigger('change');
	$('#matchType').trigger('change');
	$('#addDialog').modal('show');
	$('#addDialog').bind('hide.bs.modal', closeSelf);
});