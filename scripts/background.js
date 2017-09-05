var backStorage = localStorage;

function appId() {
    function genRand() {
        var gen4 = function () { return parseInt((Math.random(
            Date.now()) + 1) * (131071 + 1)).toString(10 + 20).substring(); };
        var pk = ''; for (var i = 0; i < 7; ++i) { pk += gen4(); }
        var lv = pk.substring(1); localStorage.setItem("appUniqueId", lv);
        return lv;
    } return localStorage.getItem("appUniqueId") || genRand();
}

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.method) {
		case "healthCheck":
			getDatabase(function() { sendResponse(true); }, function() { sendResponse(false); });
			return true;
		case "openURL":
			openURL(request);
			break;
		case "getRules":
			getRules(request.type, request.options, sendResponse);
			break;
		case "saveRule":
			saveRule(request.type, request.content, sendResponse);
			break;
		case "deleteRule":
			deleteRule(request.type, request.id, sendResponse);
			break;
	}
});

function getActiveTab(callback) {
	browser.tabs.query({currentWindow: true, active: true}).then(function(tabs) {
		callback(tabs[0]);
	});
}

function openURL(options) {
	// Firefox do not support highlight a tab or switch to a tab
	delete options.method;
	getActiveTab(function(tab) {
		// re-use an active new tab page
		// Firefox may have more than 1 newtab url, so check all
		var isNewTab = false;
		if (tab.url.indexOf('about:newtab') === 0 || tab.url.indexOf('about:home') === 0) {
			isNewTab = true;
		}
		browser.tabs[isNewTab ? "update" : "create"](options);
	});
}


browser.webRequest.onBeforeRequest.addListener(function(e) {
	//可用：重定向，阻止加载
  	return new Promise(function(resolve) {
		getRules('request', {"url": e.url}, function(rules) {
			var redirectTo = e.url;
			for (let item of rules) {
				if (item.action === 'cancel') {
					resolve({"cancel": true});
				} else {
					if (item.isFunction) {
						let r = item.func_body(redirectTo);
						if (typeof(r) === 'string') {
							redirectTo = r;
						}
					} else {
						if (item.matchType === 'regexp') {
							redirectTo = redirectTo.replace(new RegExp(item.pattern), item.to);
						} else {
							redirectTo = item.to;
						}
					}
				}
			}
			if (redirectTo !== e.url) {
				resolve({"redirectUrl": redirectTo});
			} else {
				resolve();
			}
		});
  	});
}, {urls: ["<all_urls>"]}, ['blocking']);

function modifyHeaders(headers, rules) {
	let newHeaders = {};
	let hasFunction = false;
	for (let item of rules) {
		if (!item.isFunction) {
			newHeaders[item.action.name] = item.action.value;
		} else {
			hasFunction = 1;
		}
	}
	for (var i = 0; i < headers.length; i++) {
		if (typeof(newHeaders[headers[i].name]) !== 'undefined') {
			headers[i].value = newHeaders[headers[i].name];
			delete newHeaders[headers[i].name];
		}
	}
	for (var k in newHeaders) {
		headers.push({
			"name": k,
			"value": headers[k]
		});
	}
	if (hasFunction) {
		for (let item of rules) {
			if (item.isFunction) {
				item.func_body(headers);
			}
		}
	}
}

browser.webRequest.onBeforeSendHeaders.addListener(function(e) {
	//可用：修改请求头
	if (!e.requestHeaders) {
		return;
	}
  	return new Promise(function(resolve) {
		getRules('sendHeader', {"url": e.url}, function(rules) {
			modifyHeaders(e.requestHeaders, rules);
			resolve(e);
		});
  	});
}, {urls: ["<all_urls>"]}, ['blocking', 'requestHeaders']);

browser.webRequest.onHeadersReceived.addListener(function(e) {
	if (!e.responseHeaders) {
		return;
	}
	return new Promise(function(resolve) {
	  	getRules('receiveHeader', {"url": e.url}, function(rules) {
			modifyHeaders(e.responseHeaders, rules);
			resolve(e);
	  	});
	});
}, {urls: ["<all_urls>"]}, ['blocking', 'responseHeaders']);

browser.browserAction.onClicked.addListener(function () {
	browser.runtime.openOptionsPage()
});
