const fs = require('fs');
const merge = require('merge');
const signAddon = require('sign-addon').default;
const package = require('../../package.json');
const buildTemp = fs.realpathSync(__dirname + '/../../build-temp/') + '/';
const copyDist = buildTemp + 'copy-dist/';
const exec = require('child_process').exec;
const AMOUser = require('../../encrypt/amo.json');

module.exports = function(manifest) {
	return new Promise(resolve => {
		// replace manifest
		const newManifest = merge(true, manifest);
		newManifest.applications = {
			gecko: {
				id: package.webextension.firefox.amo,
				strict_min_version: package.webextension.firefox.version
			}
		};
		fs.writeFileSync(copyDist + 'manifest.json', JSON.stringify(newManifest));
		exec(`cd ${copyDist} && zip -r ${buildTemp}amo.zip ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				signAddon({
					xpiPath: `${buildTemp}amo.zip`,
					version: package.version,
					apiKey: AMOUser.key,
					apiSecret: AMOUser.secret,
					id: package.webextension.firefox.amo
				})
				.then(() => {
					fs.unlinkSync(`${buildTemp}amo.zip`);
					resolve();
				});
			}
		});
	})
}