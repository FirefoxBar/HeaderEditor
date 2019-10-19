const fs = require('fs');
const merge = require('merge');
const common = require('./common');
const signAddon = require('sign-addon').default;
const exec = require('child_process').exec;
const AMOUser = require(common.encrypt('amo.json'));

module.exports = function(manifest) {
	return new Promise(resolve => {
		// replace manifest
		const newManifest = merge(true, manifest);
		newManifest.applications = {
			gecko: {
				id: common.config.firefox.amo,
				strict_min_version: common.config.firefox.version
			}
		};
		fs.writeFileSync(common.manifest, JSON.stringify(newManifest));
		const zipPath = common.packFile('amo.zip');
		exec(`cd ${common.dist} && zip -r ${zipPath} ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				signAddon({
					xpiPath: zipPath,
					version: common.version,
					apiKey: AMOUser.key,
					apiSecret: AMOUser.secret,
					id: common.config.firefox.amo
				})
				.then(() => {
					fs.unlinkSync(zipPath);
					resolve();
				});
			}
		});
	})
}