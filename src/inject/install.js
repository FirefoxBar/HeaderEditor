function getParams() {
	var params = {};
	var urlParts = location.href.split("?", 2);
	if (urlParts.length == 1) {
		return params;
	}
	urlParts[1].split("&").forEach(function(keyValue) {
		var splitKeyValue = keyValue.split("=", 2);
		params[decodeURIComponent(splitKeyValue[0])] = decodeURIComponent(splitKeyValue[1]);
	});
	return params;
}


if (window.location.href.indexOf('https://ext.firefoxcn.net/headereditor/install/open.html') === 0) {
	var params = getParams();
	if (params.code) {
		getResource(params.code, function(code) {
			var json = JSON.parse(code);
			if (confirm(browser.i18n.getMessage('styleInstall', [json.name]))) {
				styleInstallByCode(json);
			}
		});
	}
}