import browser from 'webextension-polyfill';
import dateFormat from 'dateformat';

const IS_ANDROID = navigator.userAgent.includes('Android');
const IS_CHROME = /Chrome\/(\d+)\.(\d+)/.test(navigator.userAgent);
const CHROME_VERSION = IS_CHROME ? (() => {
	const a = navigator.userAgent.match(/Chrome\/(\d+)\.(\d+)/);
	return parseFloat(a[1] + '.' + a[2]);
})() : null;
const IS_FIREFOX = !IS_CHROME;
const FIREFOX_VERSION = IS_FIREFOX ? (() => {
	const a = navigator.userAgent.match(/Firefox\/(\d+)\.(\d+)/);
	return parseFloat(a[1] + '.' + a[2]);
})() : null;

export default {
	IS_ANDROID: IS_ANDROID,
	IS_MOBILE: IS_ANDROID,
	IS_FIREFOX: IS_FIREFOX,
	IS_CHROME: IS_CHROME,
	CHROME_VERSION: CHROME_VERSION,
	FIREFOX_VERSION: FIREFOX_VERSION,
	IS_SUPPORT_STREAM_FILTER: typeof browser.webRequest.filterResponseData === 'function',
	TABLE_NAMES: ['request', 'sendHeader', 'receiveHeader', 'receiveBody'],
	getExportName(additional) {
		return 'HE_' + dateFormat(new Date(), 'isoUtcDateTime').replace(/\:/g, '-') + (additional ? "_" + additional : "") + '.json';
	},
	// Get Active Tab
	getActiveTab() {
		return new Promise(resolve => {
			browser.tabs.query({currentWindow: true, active: true})
			.then(tabs => tabs[0])
			.then(resolve)
		});
	},
	trimNewLines(s) {
		return s.replace(/^[\s\n]+/, "").replace(/[\s\n]+$/, "");
	},
	fetchUrl(param) {
		return new Promise((resolve, reject) => {
			const fetchParam = {
				method: param.post ? 'POST' : 'GET',
				headers: {}
			};
			let url = param.url;
			if (param.query) {
				url += '?' + (new URLSearchParams(param.query)).toString();
			}
			if (fetchParam.method === 'POST') {
				//遍历一下，查找是否有File
				let hasFile = false;
				for (const name in param.post) {
					if (param.post[name] instanceof File) {
						hasFile = true;
						break;
					}
				}
				if (hasFile) {
					const formBody = new FormData();
					for (const name in param.post) {
						if (param.post[name] instanceof File) {
							formBody.append(name, param.post[name], param.post[name].name);
						} else {
							formBody.append(name, param.post[name]);
						}
					}
					fetchParam.body = formBody;
				} else {
					fetchParam.headers['Content-Type'] = 'application/x-www-form-urlencoded';
					const body = [];
					for (const name in param.post) {
						body.push(encodeURIComponent(name) + "=" + encodeURIComponent(param.post[name]));
					}
					fetchParam.body = body.join('&');
				}
			}
			if (param.header) {
				for (const name in param.header) {
					fetchParam.headers[name] = param.header[name];
				}
			}
			fetch(url, fetchParam)
			.then(r => resolve(r.text()))
			.catch(reject)
		})
	},
	getTableName(ruleType) {
		if (ruleType === 'cancel' || ruleType === 'redirect') {
			return 'request';
		}
		if (ruleType === 'modifySendHeader') {
			return 'sendHeader';
		}
		if (ruleType === 'modifyReceiveHeader') {
			return 'receiveHeader';
		}
		if (ruleType === 'modifyReceiveBody') {
			return 'receiveBody';
		}
	},
	upgradeRuleFormat(s) {
		if (typeof(s.matchType) === "undefined") {
			s.matchType = s.type;
			delete s.type;
		}
		if (typeof(s.isFunction) === "undefined") {
			s.isFunction = false;
		} else {
			s.isFunction = s.isFunction ? true : false;
		}
		if (typeof(s.enable) === "undefined") {
			s.enable = true;
		} else {
			s.enable = s.enable ? true : false;
		}
		if ((s.ruleType === "modifySendHeader" || s.ruleType === "modifyReceiveHeader") && !s.isFunction) {
			s.action.name = s.action.name.toLowerCase();
		}
		return s;
	},
	canAccess(url) {
		// only http, https, file, extension allowed
		if (url.indexOf("http") !== 0 && url.indexOf("file") !== 0 && url.indexOf("moz-extension") !== 0 && url.indexOf("chrome-extension") !== 0 && url.indexOf("ftp") !== 0) {
			return false;
		}
		// other extensions can't be styled
		if ((url.indexOf("moz-extension") === 0 || url.indexOf("chrome-extension") === 0) && url.indexOf(browser.extension.getURL("")) !== 0) {
			return false;
		}
		if (IS_CHROME && url.indexOf('https://chrome.google.com/webstore') === 0) {
			return false;
		}
		return true;
	},
	t(key, params) {
		const s = browser.i18n.getMessage(key, params)
		return s || key;
	},
	getDomain(url) {
		if (url.indexOf("file:") == 0) {
			return '';
		}
		var d = /.*?:\/*([^\/:]+)/.exec(url)[1];
		return d;
	},
	createHeaderListener(type) {
		const result = ['blocking'];
		result.push(type);
		if (IS_CHROME && chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
			result.push('extraHeaders');
		}
		return result;
	}
}
