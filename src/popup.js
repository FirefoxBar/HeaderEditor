document.getElementById('openManage').addEventListener('click', function() {
	browser.runtime.sendMessage({"method": "openURL", "url": "manage.html"});
	close();
}, false);