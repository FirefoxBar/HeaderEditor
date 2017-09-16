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
			getDatabase().then(() => {
				sendResponse(true);
			}).catch(() => {
				sendResponse(false);
			});
			return true;
		case "openURL":
			openURL(request);
			break;
		case "getRules":
			sendResponse(getRules(request.type, request.options));
			break;
		case "saveRule":
			saveRule(request.type, request.content).then(sendResponse);
			break;
		case "deleteRule":
			deleteRule(request.type, request.id).then(sendResponse);
			break;
		case 'updateCache':
			if (request.type === 'all') {
				updateCache('request');
				updateCache('sendHeader');
				updateCache('receiveHeader');
			} else {
				updateCache(request.type);
			}
			sendResponse();
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

//给图片右键菜单增加快速添加反防盗链的功能
runTryCatch(() => {
	browser.contextMenus.create({
		id: "add-anti-theft-link",
		type: "normal",
		title: t('add_anti_theft_link'),
		contexts: ["image"],
		targetUrlPatterns: ["http://*/*", "https://*/*", "ftp://*/*"]
	});
});
browser.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === 'add-anti-theft-link') {
		openURL({"url": browser.extension.getURL("anti-theft-link.html") + '?url=' + info.srcUrl});
	}
});



browser.webRequest.onBeforeRequest.addListener(function(e) {
	//可用：重定向，阻止加载
	let rules = getRules('request', {"url": e.url, "enable": 1});
	let redirectTo = e.url;
	const detail = {
		"url": e.url,
		"method": e.method,
		"isFrame": e.frameId === 0,
		"type": e.type,
		"time": e.timeStamp,
		"originUrl": e.originUrl || ''
	};
	for (let item of rules) {
		if (item.action === 'cancel') {
			return {"cancel": true};
		} else {
			if (item.isFunction) {
				runTryCatch(() => {
					let r = item.func_body(redirectTo, detail);
					if (typeof(r) === 'string') {
						redirectTo = r;
					}
				});
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
		if (/^(http|https|ftp|file)%3A/.test(redirectTo)) {
			redirectTo = decodeURIComponent(redirectTo);
		}
		return {"redirectUrl": redirectTo};
	}
}, {urls: ["<all_urls>"]}, ['blocking']);

function modifyHeaders(headers, rules, details) {
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
	for (let k in newHeaders) {
		headers.push({
			"name": k,
			"value": newHeaders[k]
		});
	}
	if (hasFunction) {
		const detail = {
			"url": details.url,
			"method": details.method,
			"isFrame": details.frameId === 0,
			"type": details.type,
			"time": details.timeStamp,
			"originUrl": details.originUrl || ''
		};
		for (let item of rules) {
			if (item.isFunction) {
				runTryCatch(() => {
					item.func_body(headers, detail);
				});
			}
		}
	}
}

browser.webRequest.onBeforeSendHeaders.addListener(function(e) {
	//可用：修改请求头
	if (!e.requestHeaders) {
		return;
	}
	let rules = getRules('sendHeader', {"url": e.url, "enable": 1});
	modifyHeaders(e.requestHeaders, rules, e);
	return {"requestHeaders": e.requestHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'requestHeaders']);

browser.webRequest.onHeadersReceived.addListener(function(e) {
	if (!e.responseHeaders) {
		return;
	}
	let rules = getRules('receiveHeader', {"url": e.url, "enable": 1});
	modifyHeaders(e.responseHeaders, rules, e);
	return {"responseHeaders": e.responseHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'responseHeaders']);

browser.browserAction.onClicked.addListener(function () {
	browser.runtime.openOptionsPage()
});
