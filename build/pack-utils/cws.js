const fs = require('fs');
const exec = require('child_process').exec;
const webStore = require('chrome-webstore-upload');
const common = require('./common');
const CWSUser = require(common.encrypt('cws.json'));
const client = webStore({
	extensionId: common.config.chrome.id,
	clientId: CWSUser.id,
	clientSecret: CWSUser.secret,
	refreshToken: CWSUser.token
});

module.exports = function() {
	return new Promise(resolve => {
		const zipPath = common.packFile('cws.zip');
		exec(`cd ${common.dist} && zip -r ${zipPath} ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				const distStream = fs.createReadStream(zipPath);
				client.fetchToken().then(token => {
					client.uploadExisting(distStream, token)
						.then(() => client.publish("default", token))
						.then(() => {
							fs.unlinkSync(zipPath);
							resolve();
						})
						.catch(console.log);
				});
			}
		});
	})
};