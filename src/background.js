var frameIdMessageable, backStorage = localStorage;

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


function onBeforeRequest(e) {
	//可用：重定向，阻止加载
  	return new Promise(function(resolve) {
		getRules('request', {"url": e.url}, function(rules) {
			var redirectTo = null;
			for (var i in rules) {
				if (rules[i].action === 'cancel') {
					resolve({"cancel": true});
				} else {
					if (rules[i].type === 'regexp') {
						redirectTo = e.url.replace(new RegExp(rules[i].pattern), rules[i].to);
					} else {
						redirectTo = rules[i].to;
					}
				}
			}
			if (redirectTo != null) {
				resolve({"redirectUrl": redirectTo});
			} else {
				resolve();
			}
		});
  	});
}
function onBeforeSendHeaders(e) {
	//可用：修改请求头
	if (!e.requestHeaders) {
		return;
	}
  	return new Promise(function(resolve) {
		getRules('sendHeader', {"url": e.url}, function(rules) {
			var headers = {};
			for (var i = 0; i < rules.length; i++) {
				headers[rules[i].action.name] = rules[i].action.value;
			}
			for (var i = 0; i < e.requestHeaders.length; i++) {
				if (typeof(headers[e.requestHeaders[i].name]) !== 'undefined') {
					e.requestHeaders[i].value = headers[e.requestHeaders[i].name];
					delete headers[e.requestHeaders[i].name];
				}
			}
			for (var k in headers) {
				e.requestHeaders.push({
					"name": k,
					"value": headers[k]
				});
			}
			resolve({"requestHeaders": e.requestHeaders});
		});
  	});
}
function onHeadersReceived(e) {
	//可用：修改响应头
  	return new Promise(function(resolve) {
		getRules('receiveHeader', {"url": e.url}, function(rules) {
			var headers = {};
			for (var i = 0; i < rules.length; i++) {
				headers[rules[i].action.name] = rules[i].action.value;
			}
			for (var i = 0; i < e.responseHeaders.length; i++) {
				if (typeof(headers[e.responseHeaders[i].name]) !== 'undefined') {
					e.responseHeaders[i].value = headers[e.responseHeaders[i].name];
					delete headers[e.responseHeaders[i].name];
				}
			}
			for (var k in headers) {
				e.responseHeaders.push({
					"name": k,
					"value": headers[k]
				});
			}
			resolve({"responseHeaders": e.responseHeaders});
		});
  	});
}

browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, {urls: ["<all_urls>"]}, ['blocking']);
browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ['blocking', 'requestHeaders']);
browser.webRequest.onHeadersReceived.addListener(onBeforeSendHeaders, {urls: ["<all_urls>"]}, ['blocking', 'responseHeaders']);