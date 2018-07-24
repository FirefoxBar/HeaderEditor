// is mobile or not
const IS_ANDROID = navigator.userAgent.includes('Android');
//const IS_IOS = navigator.userAgent.includes('iOS');
//const IS_MOBILE = (IS_ANDROID || IS_IOS);
const IS_MOBILE = IS_ANDROID;

const HE_DUMP_FILE_NAME = "HE-{Y}-{m}-{d}_{H}.{i}.{s}{ADDITIONAL}.json";

const tableNames = ['request', 'sendHeader', 'receiveHeader'];

let IS_FIREFOX = false;
let IS_CHROME = false;
let FIREFOX_VERSION = 0;
let CHROME_VERSION = 0;
if (/Firefox\/(\d+)\.(\d+)/.test(navigator.userAgent)) {
	IS_FIREFOX = true;
	FIREFOX_VERSION = (() => {
		let a = navigator.userAgent.match(/Firefox\/(\d+)\.(\d+)/);
		return parseFloat(a[1] + '.' + a[2]);
	})();
} else if (/Chrome\/(\d+)\.(\d+)/.test(navigator.userAgent)) {
	IS_CHROME = true;
	CHROME_VERSION = (() => {
		let a = navigator.userAgent.match(/Chrome\/(\d+)\.(\d+)/);
		return parseFloat(a[1] + '.' + a[2]);
	})();
}

// make querySelectorAll enumeration code readable
["forEach", "some", "indexOf", "map"].forEach((method) => {
	if (typeof(NodeList.prototype[method]) === 'undefined') {
		NodeList.prototype[method]= Array.prototype[method];
	}
});
(function(constructor) {
	if (constructor &&
		constructor.prototype &&
		constructor.prototype.firstElementChild == null) {
		Object.defineProperty(constructor.prototype, 'firstElementChild', {
			get: function() {
				var node, nodes = this.childNodes, i = 0;
				while (node = nodes[i++]) {
					if (node.nodeType === 1) {
						return node;
					}
				}
				return null;
			}
		});
	}
})(window.Node || window.Element);

//date format
function DateFormat(f, d) {
	if (typeof(d) === 'undefined') {
		d = new Date();
	}
	f = f.replace(/\{Y\}/g, d.getFullYear());
	f = f.replace(/\{m\}/g, d.getMonth() + 1);
	f = f.replace(/\{d\}/g, d.getDate());
	f = f.replace(/\{H\}/g, d.getHours());
	f = f.replace(/\{i\}/g, d.getMinutes());
	f = f.replace(/\{s\}/g, d.getSeconds());
	return f;
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

function getDomain(url) {
	if (url.indexOf("file:") == 0) {
		return '';
	}
	var d = /.*?:\/*([^\/:]+)/.exec(url)[1];
	return d;
}


// Get Active Tab
function getActiveTab(callback) {
	browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
		callback(tabs[0]);
	});
}

function trimNewLines(s) {
	return s.replace(/^[\s\n]+/, "").replace(/[\s\n]+$/, "");
}

function getURL(url, isPost) {
	return new Promise((resolve, fail) => {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState == 4) {
				if (xhr.status >= 400) {
					fail();
				} else {
					resolve(xhr.responseText);
				}
			}
		};
		if (url.length > 2000 || isPost) {
			var parts = url.split("?");
			xhr.open("POST", parts[0], true);
			xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			xhr.send(parts[1]);
		} else {
			xhr.open("GET", url, true);
			xhr.send();
		}
	});
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