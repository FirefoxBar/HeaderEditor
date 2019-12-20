const fs = require('fs');
const merge = require('merge');
const common = require('./common');
const signAddon = require('sign-addon').default;
const exec = require('child_process').exec;

module.exports = function(manifest, outputDir) {
	return new Promise(resolve => {
		// replace manifest
		const newManifest = merge(true, manifest);
		newManifest.applications = {
			gecko: {
				id: common.config.firefox.xpi,
				strict_min_version: common.config.firefox.version,
				update_url: common.config.firefox.update
			}
		};
		fs.writeFileSync(common.manifest, JSON.stringify(newManifest));
		const zipPath = common.packFile('xpi.zip');
		exec(`cd ${common.dist} && zip -r ${zipPath} ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				signAddon({
					xpiPath: zipPath,
					version: common.version,
					apiKey: common.config.firefox.mozilla.key,
					apiSecret: process.env[common.config.firefox.mozilla.secret],
					id: common.config.firefox.xpi,
					downloadDir: common.pack
				})
				.then(result => {
					if (result.success) {
						console.log("Downloaded signed addon");
						fs.unlinkSync(zipPath);
						const out = common.resolve(outputDir, common.config.dist.replace('{VER}', common.version) + '.xpi');
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