const fs = require('fs');
const exec = require('child_process').exec;
const buildTemp = fs.realpathSync(__dirname + '/../../build-temp/') + '/';
const copyDist = buildTemp + 'copy-dist/';
const webStore = require('chrome-webstore-upload');
const package = require('../../package.json');
const CWSUser = require('../../encrypt/cws.json');
const client = webStore({
	extensionId: package.webextension.chrome.id,
	clientId: CWSUser.id,
	clientSecret: CWSUser.secret,
	refreshToken: CWSUser.token
});

module.exports = function() {
	return new Promise(resolve => {
		exec(`cd ${copyDist} && zip -r ${buildTemp}cws.zip ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				const distStream = fs.createReadStream(`${buildTemp}cws.zip`);
				client.fetchToken().then(token => {
					client.uploadExisting(distStream, token).then(res => {
						client.publish("default", token).then(res => {
							fs.unlinkSync(`${buildTemp}cws.zip`);
							resolve();
						});
					});
				});
			}
		});
	})
};