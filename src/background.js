import browser from 'webextension-polyfill'
import storage from './core/storage'
import rules from './core/rules'
import utils from './core/utils'
import { TextEncoder, TextDecoder } from 'text-encoding'

window.IS_BACKGROUND = true;

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
					rules.updateCache('receiveHeader'),
					rules.updateCache('receiveBody')
				]);
			} else {
				return rules.updateCache(request.type);
			}
	}
	sendResponse();
});

function openURL(options) {
	delete options.method;
	return new Promise(resolve => {
		browser.tabs.query({ currentWindow: true, url: options.url })
			.then(tabs => {
				if (tabs.length) {
					browser.tabs.update(tabs[0].id, {
						active: true
					}).then(resolve);
				} else {
					utils.getActiveTab()
						.then(tab => {
							// re-use an active new tab page
							// Firefox may have more than 1 newtab url, so check all
							const isNewTab = tab.url.indexOf('about:newtab') === 0 || tab.url.indexOf('about:home') === 0 || tab.url.indexOf('chrome://newtab/') === 0;
							browser.tabs[isNewTab ? "update" : "create"](options).then(resolve);
						});
				}
			})
			.catch(e => {
				browser.tabs.create(options).then(resolve);
			})
	})
}

if (typeof(browser.contextMenus) !== 'undefined') {
	browser.contextMenus.onClicked.addListener((info, tab) => {
		if (info.menuItemId === 'add-anti-hot-link') {
			openURL({ url: browser.runtime.getURL("options/options.html") + '?action=add-anti-hot-link&url=' + info.srcUrl });
		}
	});
}

const REQUEST_TYPE = {
	REQUEST: 0,
	RESPONSE: 1
};
class RequestHandler {
	_disableAll = false;
	excludeHe = true;
	includeHeaders = false;
	modifyBody = false;
	savedRequestHeader = new Map();
	_deleteHeaderTimer = null;
	_deleteHeaderQueue = new Map();
	_textDecoder = new Map();
	_textEncoder = new Map();

	constructor() {
		this.initHook();
		this.loadPrefs();
	}
	get disableAll() {
		return this._disableAll;
	}
	set disableAll(to) {
		if (this._disableAll === to) {
			return;
		}
		this._disableAll = to;
		browser.browserAction.setIcon({
			path: "/assets/images/128" + (to ? "w" : "") + ".png"
		});
	}

	initHook() {
		browser.webRequest.onBeforeRequest.addListener(this.handleBeforeRequest.bind(this), { urls: ["<all_urls>"] }, ['blocking']);
		browser.webRequest.onBeforeSendHeaders.addListener(this.handleBeforeSend.bind(this), { urls: ["<all_urls>"] }, utils.createHeaderListener('requestHeaders'));
		browser.webRequest.onHeadersReceived.addListener(this.handleReceived.bind(this), { urls: ["<all_urls>"] }, utils.createHeaderListener('responseHeaders'));
	}

	loadPrefs() {
		storage.prefs.watch('exclude-he', val => {
			this.excludeHe = val;
		});

		storage.prefs.watch('disable-all', val => {
			this.disableAll = val;
		});

		storage.prefs.watch('include-headers', val => {
			this.includeHeaders = val;
		});

		storage.prefs.watch('modify-body', val => {
			this.modifyBody = val;
		});

		storage.prefs.onReady()
			.then(prefs => {
				this.excludeHe = prefs.get('exclude-he');
				this.disableAll = prefs.get('disable-all');
				this.includeHeaders = prefs.get('include-headers');
				this.modifyBody = prefs.get('modify-body');
			})
	}

	beforeAll(e) {
		if (this.disableAll) {
			return false;
		}
		//判断是否是HE自身
		if (this.excludeHe && e.url.indexOf(browser.runtime.getURL('')) === 0) {
			return false;
		}
		return true;
	}

	/**
	 * BeforeRequest事件，可撤销、重定向
	 * @param any e
	 */
	handleBeforeRequest(e) {
		if (!this.beforeAll(e)) {
			return;
		}
		//可用：重定向，阻止加载
		const rule = rules.get('request', { url: e.url, enable: true });
		// Browser is starting up, pass all requests
		if (rule === null) {
			return;
		}
		let redirectTo = e.url;
		const detail = this._makeDetails(e);
		for (const item of rule) {
			if (item.action === 'cancel' && !item.isFunction) {
				return { cancel: true };
			} else {
				if (item.isFunction) {
					try {
						const r = item._func(redirectTo, detail);
						if (typeof(r) === 'string') {
							redirectTo = r;
						}
						if (r === '_header_editor_cancel_' || (item.action === 'cancel' && r === true)) {
							return { "cancel": true };
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
			return { redirectUrl: redirectTo };
		}
	}

	/**
	 * beforeSend事件，可修改请求头
	 * @param any e
	 */
	handleBeforeSend(e) {
		if (!this.beforeAll(e)) {
			return;
		}
		// 修改请求头
		if (!e.requestHeaders) {
			return;
		}
		const rule = rules.get('sendHeader', { "url": e.url, "enable": true });
		// Browser is starting up, pass all requests
		if (rule === null) {
			return;
		}
		this._modifyHeaders(e, REQUEST_TYPE.REQUEST, rule);
		return { requestHeaders: e.requestHeaders };
	}


	handleReceived(e) {
		if (!this.beforeAll(e)) {
			return;
		}
		const detail = this._makeDetails(e);
		// 删除暂存的headers
		if (this.includeHeaders) {
			detail.requestHeaders = this.savedRequestHeader.get(e.requestId) || null;
			this.savedRequestHeader.delete(e.requestId);
			this._deleteHeaderQueue.delete(e.requestId);
		}
		// 修改响应体
		if (this.modifyBody) {
			this._modifyReceivedBody(e, detail);
		}
		// 修改响应头
		if (!e.responseHeaders) {
			return;
		}
		const rule = rules.get('receiveHeader', { "url": e.url, "enable": true });
		// Browser is starting up, pass all requests
		if (rule) {
			this._modifyHeaders(e, REQUEST_TYPE.RESPONSE, rule, detail);
		}
		return { responseHeaders: e.responseHeaders };
	}

	_makeDetails(request) {
		const details = {
			id: request.requestId,
			url: request.url,
			tab: request.tabId,
			method: request.method,
			frame: request.frameId,
			parentFrame: request.parentFrameId,
			proxy: request.proxyInfo || null,
			type: request.type,
			time: request.timeStamp,
			originUrl: request.originUrl || '',
			documentUrl: request.documentUrl || '',
			requestHeaders: null,
			responseHeaders: null
		};

		['statusCode', 'statusLine', 'requestHeaders', 'responseHeaders'].forEach(p => {
			if (p in request) {
				details[p] = request[p];
			}
		});

		return details;
	}

	_textEncode(encoding, text) {
		let encoder = this._textEncoder.get(encoding);
		if (!encoder) {
			// UTF-8使用原生API，性能更好
			if (encoding === "UTF-8" && window.TextEncoder) {
				encoder = new window.TextEncoder();
			} else {
				encoder = new TextEncoder(encoding, { NONSTANDARD_allowLegacyEncoding: true });
			}
			this._textEncoder.set(encoding, encoder);
		}
		// 防止解码失败导致整体错误
		try {
			return encoder.encode(text);
		} catch (e) {
			console.log(e);
			return new Uint8Array();
		}
	}

	_textDecode(encoding, buffer) {
		let encoder = this._textDecoder.get(encoding);
		if (!encoder) {
			// 如果原生支持的话，优先使用原生
			if (window.TextDecoder) {
				try {
					encoder = new window.TextDecoder(encoding);
				} catch (e) {
					encoder = new TextDecoder(encoding);
				}
			} else {
				encoder = new TextDecoder(encoding);
			}
			this._textDecoder.set(encoding, encoder);
		}
		// 防止解码失败导致整体错误
		try {
			return encoder.decode(buffer);
		} catch (e) {
			console.log(e);
			return "";
		}
	}

	_modifyReceivedBody(e, detail) {
		if (!utils.IS_SUPPORT_STREAM_FILTER){
			return;
		}

		let rule = rules.get('receiveBody', { url: e.url, enable: true });
		if (rule === null) {
			return;
		}
		rule = rule.filter(item => item.isFunction);
		if (rule.length === 0) {
			return;
		}

		const filter = browser.webRequest.filterResponseData(e.requestId);
		let buffers = null;
		filter.ondata = (event) => {
			const data = event.data;
			if (buffers === null) {
				buffers = new Uint8Array(data);
				return;
			}
			const buffer = new Uint8Array(buffers.byteLength + data.byteLength);
			// 将响应分段数据收集拼接起来，在完成加载后整体替换。
			// 这可能会改变浏览器接收数据分段渲染的行为。
			buffer.set(buffers);
			buffer.set(new Uint8Array(data), buffers.buffer.byteLength);
			buffers = buffer;
		}
	
		filter.onstop = () => {
			if (buffers === null) {
				filter.close();
				return;
			}

			// 缓存实例，减少开销
			for (const item of rule) {
				const encoding = item.encoding || "UTF-8";
				try {
					const _text = this._textDecode(encoding, buffers.buffer);
					const text = item._func(_text, detail);
					if (typeof text === 'string' && text !== _text){
						buffers = this._textEncode(encoding, text);
					}
				} catch (e) {
					console.error(e);
				}
			}

			filter.write(buffers.buffer);
			buffers = null;
			filter.close();
		}

		filter.onerror = () => {
			buffers = null;
		}
	}

	_modifyHeaders(request, type, rule, presetDetail) {
		const headers = request[type === REQUEST_TYPE.REQUEST ? "requestHeaders" : "responseHeaders"];
		if (!headers) {
			return;
		}
		if (this.includeHeaders && type === REQUEST_TYPE.REQUEST) {
			// 暂存headers
			this.savedRequestHeader.set(request.requestId, request.requestHeaders);
			this._autoDeleteSavedHeader(request.requestId);
		}
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
			if (newHeaders[name] === "_header_editor_remove_") {
				headers.splice(i, 1);
				i--;
			} else {
				headers[i].value = newHeaders[name];
			}
			delete newHeaders[name];
		}
		for (const k in newHeaders) {
			if (newHeaders[k] === "_header_editor_remove_") {
				continue;
			}
			headers.push({
				name: k,
				value: newHeaders[k]
			});
		}
		if (hasFunction) {
			const detail = presetDetail ? presetDetail : this._makeDetails(request);
			rule.forEach(item => {
				try {
					item._func(headers, detail);
				} catch (e) {
					console.log(e);
				}
			});
		}
	}

	_autoDeleteSavedHeader(id) {
		if (id) {
			this._deleteHeaderQueue.set(id, new Date().getTime() / 100);
		}
		if (this._deleteHeaderTimer !== null) {
			return;
		}
		this._deleteHeaderTimer = setTimeout(() => {
			// clear timeout
			clearTimeout(this._deleteHeaderTimer);
			this._deleteHeaderTimer = null;
			// check time
			const curTime = new Date().getTime() / 100;
			// k: id, v: time
			const iter = this._deleteHeaderQueue.entries();
			for (const [k, v] of iter) {
				if (curTime - v >= 90) {
					this.savedRequestHeader.delete(k)
					this._deleteHeaderQueue.delete(k);
				}
			}
			if (this._deleteHeaderQueue.size > 0) {
				this._autoDeleteSavedHeader();
			}
		}, 10000);
	}
}

new RequestHandler();

let antiHotLinkMenu = null;

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