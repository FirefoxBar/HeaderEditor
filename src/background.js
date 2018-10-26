import browser from 'webextension-polyfill'
import storage from './core/storage'
import rules from './core/rules'
import utils from './core/utils'

window.IS_BACKGROUND = true;

let antiHotLinkMenu = null;

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method === 'notifyBackground') {
		request.method = request.reason;
	}
	switch (request.method) {
		case "healthCheck":
			return new Promise(resolve => {
				storage.getDatabase().then(() => {
					resolve(true);
				}).catch(() => {
					resolve(false);
				});
			})
		case "openURL":
			return openURL(request);
		case "getRules":
			sendResponse(getRules(request.type, request.options));
			return;
		case "saveRule":
			return rules.save(request.type, request.content);
		case "deleteRule":
			return rules.remove(request.type, request.id);
		case 'updateCache':
			if (request.type === 'all') {
				return Promise.all([
					rules.updateCache('request'),
					rules.updateCache('sendHeader'),
					rules.updateCache('receiveHeader')
				]);
			} else {
				return rules.updateCache(request.type);
			}
	}
	sendResponse();
});

function openURL(options) {
	delete options.method;
	browser.tabs.query({currentWindow: true, url: options.url}).then((tabs) => {
		if (tabs.length) {
			return browser.tabs.update(tabs[0].id, {
				"active": true
			});
		} else {
			utils.getActiveTab()
			.then(tab => {
				// re-use an active new tab page
				// Firefox may have more than 1 newtab url, so check all
				const isNewTab = tab.url.indexOf('about:newtab') === 0 || tab.url.indexOf('about:home') === 0 || tab.url.indexOf('chrome://newtab/') === 0;
				return browser.tabs[isNewTab ? "update" : "create"](options);
			});
		}
	});
}

if (typeof(browser.contextMenus) !== 'undefined') {
	browser.contextMenus.onClicked.addListener((info, tab) => {
		if (info.menuItemId === 'add-anti-hot-link') {
			openURL({"url": browser.extension.getURL("options/options.html") + '?action=add-anti-hot-link&url=' + info.srcUrl});
		}
	});
}

browser.webRequest.onBeforeRequest.addListener(function(e) {
	if (storage.prefs.get('disable-all')) {
		return;
	}
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//可用：重定向，阻止加载
	const rule = rules.get('request', {"url": e.url, "enable": true});
	// Browser is starting up, pass all requests
	if (rule === null) {
		return;
	}
	let redirectTo = e.url;
	const detail = {
		"id": e.requestId,
		"url": e.url,
		"method": e.method,
		"isFrame": e.frameId === 0,
		"type": e.type,
		"time": e.timeStamp,
		"originUrl": e.originUrl || ''
	};
	for (const item of rule) {
		if (item.action === 'cancel') {
			return {"cancel": true};
		} else {
			if (item.isFunction) {
				try {
					const r = item._func(redirectTo, detail);
					if (typeof(r) === 'string') {
						redirectTo = r;
					}
				} catch (e) {
					console.log(e);
				}
			} else {
				if (item.matchType === 'regexp') {
					redirectTo = redirectTo.replace(item._reg, item.to);
				} else {
					redirectTo = item.to;
				}
			}
		}
	}
	if (redirectTo && redirectTo !== e.url) {
		if (/^([a-zA-Z0-9]+)%3A/.test(redirectTo)) {
			redirectTo = decodeURIComponent(redirectTo);
		}
		return {"redirectUrl": redirectTo};
	}
}, {urls: ["<all_urls>"]}, ['blocking']);

function modifyHeaders(headers, rule, details) {
	const newHeaders = {};
	let hasFunction = false;
	for (let i = 0; i < rule.length; i++) {
		if (!rule[i].isFunction) {
			newHeaders[rule[i].action.name] = rule[i].action.value;
			rule.splice(i, 1);
			i--;
		} else {
			hasFunction = true;
		}
	}
	for (let i = 0; i < headers.length; i++) {
		const name = headers[i].name.toLowerCase();
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
			"id": e.requestId,
			"url": details.url,
			"method": details.method,
			"isFrame": details.frameId === 0,
			"type": details.type,
			"time": details.timeStamp,
			"originUrl": details.originUrl || ''
		};
		rule.forEach(item => {
			try {
				item._func(headers, detail);
			} catch (e) {
				console.log(e);
			}
		});
	}
}

browser.webRequest.onBeforeSendHeaders.addListener(function(e) {
	if (storage.prefs.get('disable-all')) {
		return;
	}
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//修改请求头
	if (!e.requestHeaders) {
		return;
	}
	const rule = rules.get('sendHeader', {"url": e.url, "enable": true});
	// Browser is starting up, pass all requests
	if (rule === null) {
		return;
	}
	modifyHeaders(e.requestHeaders, rule, e);
	return {"requestHeaders": e.requestHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'requestHeaders']);

browser.webRequest.onHeadersReceived.addListener(function(e) {
	if (storage.prefs.get('disable-all')) {
		return;
	}
	//判断是否是HE自身
	if (storage.prefs.get('exclude-he') && e.url.indexOf(browser.extension.getURL('')) === 0) {
		return;
	}
	//修改请求头
	if (!e.responseHeaders) {
		return;
	}
	const rule = rules.get('receiveHeader', {"url": e.url, "enable": true});
	// Browser is starting up, pass all requests
	if (rule === null) {
		return;
	}
	modifyHeaders(e.responseHeaders, rule, e);
	return {"responseHeaders": e.responseHeaders};
}, {urls: ["<all_urls>"]}, ['blocking', 'responseHeaders']);

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

storage.prefs.watch('add-hot-link', val => {
	toggleAntiHotLinkMenu(val);
});

storage.prefs.onReady()
.then(prefs => {
	toggleAntiHotLinkMenu(prefs.get('add-hot-link'));
})