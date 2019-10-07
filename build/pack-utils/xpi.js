const fs = require('fs');
const merge = require('merge');
const signAddon = require('sign-addon').default;
const package = require('../../package.json');
const buildTemp = fs.realpathSync(__dirname + '/../../build-temp/') + '/';
const copyDist = buildTemp + 'copy-dist/';
const exec = require('child_process').exec;
const AMOUser = require('../../encrypt/amo.json');

module.exports = function(manifest, outputDir) {
	return new Promise(resolve => {
		// replace manifest
		const newManifest = merge(true, manifest);
		newManifest.applications = {
			gecko: {
				id: package.webextension.firefox.xpi,
				strict_min_version: package.webextension.firefox.version,
				update_url: package.webextension.firefox.update
			}
		};
		fs.writeFileSync(copyDist + 'manifest.json', JSON.stringify(newManifest));
		exec(`cd ${copyDist} && zip -r ${buildTemp}xpi.zip ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				signAddon({
					xpiPath: `${buildTemp}xpi.zip`,
					version: package.version,
					apiKey: AMOUser.key,
					apiSecret: AMOUser.secret,
					id: package.webextension.firefox.xpi,
					downloadDir: buildTemp
				})
				.then(result => {
					if (result.success) {
						console.log("Downloaded signed addon");
						fs.unlinkSync(`${buildTemp}xpi.zip`);
						const out = outputDir + package.webextension.dist.replace('{VER}', package.version) + '.xpi';
						// Move download file to output dir
						if (result.downloadedFiles[0]) {
							fs.renameSync(result.downloadedFiles[0], out);
							resolve(out);
						} else {
							resolve();
						}
					} else {
						console.log("Sign failed");
					}
				})
			}
		});
	})
}