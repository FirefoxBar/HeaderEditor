// is mobile or not
const IS_ANDROID = navigator.userAgent.includes('Android');
//const IS_IOS = navigator.userAgent.includes('iOS');
//const IS_MOBILE = (IS_ANDROID || IS_IOS);
const IS_MOBILE = IS_ANDROID;

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
