import browser from 'webextension-polyfill';
import merge from 'merge';
import utils from './utils';

export default {
	tabs() {
		return new Promise(resolve => {
			if (utils.IS_MOBILE) {
				browser.tabs.query({}).then(tabs => {
					tabs.forEach(tab => {
						if (utils.canAccess(tab.url)) {
							browser.tabs.sendMessage(tab.id, request);
						}
					});
					resolve();
				});
			} else {
				// notify other tabs
				browser.windows.getAll({populate: true}).then(windows => {
					windows.forEach(win => {
						win.tabs.forEach(tab => {
							if (utils.canAccess(tab.url)) {
								browser.tabs.sendMessage(tab.id, request);
							}
						});
					});
					resolve();
				});
			}
		});
	},
	background(request) {
		return browser.runtime.sendMessage(merge(true, request, {
			method: "notifyBackground",
			reason: request.method
		}));
	}
}