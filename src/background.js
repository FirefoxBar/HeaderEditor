import browser from 'webextension-polyfill'
import storage from './core/storage'
import rules from './core/rules'
import utils from './core/utils'

let antiHotLinkMenu = null;

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method === 'notifyBackground') {
		request.method = request.reason;
	}
	switch (request.method) {
		case "healthCheck":
			storage.getDatabase().then(() => {
				sendResponse(true);
			}).catch(() => {
				sendResponse(false);
			});
			return true;
		case "openURL":
			openURL(request, sendResponse);
			break;
		case "getRules":
			sendResponse(getRules(request.type, request.options));
			return;
		case "saveRule":
			rules.save(request.type, request.content).then(sendResponse);
			break;
		case "deleteRule":
			rules.remove(request.type, request.id).then(sendResponse);
			break;
		case 'updateCache':
			if (request.type === 'all') {
				Promise.all([
					rules.updateCache('request'),
					rules.updateCache('sendHeader'),
					rules.updateCache('receiveHeader')
				])
				.then(sendResponse);
			} else {
				rules.updateCache(request.type).then(sendResponse);
			}
			break;
	}
	sendResponse();
	return true;
});

function openURL(options, sendResponse) {
	delete options.method;
	browser.tabs.query({currentWindow: true, url: options.url}).then((tabs) => {
		if (tabs.length) {
			browser.tabs.update(tabs[0].id, {
				"active": true
			}).then(sendResponse);
		} else {
			utils.getActiveTab()
			.then(tab => {
				// re-use an active new tab page
				// Firefox may have more than 1 newtab url, so check all
				const isNewTab = tab.url.indexOf('about:newtab') === 0 || tab.url.indexOf('about:home') === 0 || tab.url.indexOf('chrome://newtab/') === 0;
				browser.tabs[isNewTab ? "update" : "create"](options).then(sendResponse);
			});
		}
	});
}

if (typeof(browser.contextMenus) !== 'undefined') {
	browser.contextMenus.onClicked.addListener((info, tab) => {
		if (info.menuItemId === 'add-anti-hot-link') {
			openURL({"url": browser.extension.getURL("manage.html") + '?action=add-anti-hot-link&url=' + info.srcUrl});
		}
	});
}

browser.webRequest.onBeforeRequest.addListener(function(e) {
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//可用：重定向，阻止加载
	const rules = rules.get('request', {"url": e.url, "enable": 1});
	let redirectTo = e.url;
	const detail = {
		"url": e.url,
		"method": e.method,
		"isFrame": e.frameId === 0,
		"type": e.type,
		"time": e.timeStamp,
		"originUrl": e.originUrl || ''
	};
	for (const item of rules) {
		if (item.action === 'cancel') {
			return {"cancel": true};
		} else {
			if (item.isFunction) {
				runTryCatch(() => {
					const r = item._func(redirectTo, detail);
					if (typeof(r) === 'string') {
						redirectTo = r;
					}
				});
			} else {
				if (item.matchType === 'regexp') {
					redirectTo = redirectTo.replace(item._reg, item.to);
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
	const newHeaders = {};
	let hasFunction = false;
	for (let item of rules) {
		if (!item.isFunction) {
			newHeaders[item.action.name] = item.action.value;
		} else {
			hasFunction = true;
		}
	}
	for (let i = 0; i < headers.length; i++) {
		const name = headers[i].name;
		if (newHeaders[name] === undefined) {
			continue;
		}
		if (newHeaders[name] === '_header_editor_remove_') {
			headers.splice(i, 1);
			i--;
		} else {
			headers[i].value = newHeaders[name];
		}
		delete newHeaders[name];
	}
	for (const k in newHeaders) {
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
				try {
					item._func(headers, detail);
				} catch (e) {
					console.log(e);
				}
			}
		}
	}
}

browser.webRequest.onBeforeSendHeaders.addListener(function(e) {
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//修改请求头
	if (!e.requestHeaders) {
		return;
	}
	const rules = rules.get('sendHeader', {"url": e.url, "enable": 1});
	modifyHeaders(e.requestHeaders, rules, e);
	return {"requestHeaders": e.requestHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'requestHeaders']);

browser.webRequest.onHeadersReceived.addListener(function(e) {
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//修改请求头
	if (!e.responseHeaders) {
		return;
	}
	const rules = rules.get('receiveHeader', {"url": e.url, "enable": 1});
	modifyHeaders(e.responseHeaders, rules, e);
	return {"responseHeaders": e.responseHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'responseHeaders']);

browser.browserAction.onClicked.addListener(function () {
	openURL({"url": browser.extension.getURL('options/options.html')});
});

function toggleAntiHotLinkMenu(has) {
	if (utils.IS_MOBILE) {
		return;
	}
	if (has && antiHotLinkMenu === null) {
		antiHotLinkMenu = browser.contextMenus.create({
			id: "add-anti-hot-link",
			type: "normal",
			title: utils.t('add_anti_hot_link'),
			contexts: ["image"]
		});
	}
	if (!has && antiHotLinkMenu !== null) {
		browser.contextMenus.remove(antiHotLinkMenu);
		antiHotLinkMenu = null;
	}
}
function requestUserPrefs() {
	let t = setTimeout(() => {
		clearTimeout(t);
		t = null;
		if (!storage.prefs.isDefault) {
			toggleAntiHotLinkMenu(storage.prefs.get('add-hot-link'));
		} else {
			requestUserPrefs();
		}
	}, 10);
}
requestUserPrefs();