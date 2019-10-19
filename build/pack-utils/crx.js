const crypto = require('crypto');
const RSA = require("node-rsa");
const fs = require('fs');
const common = require('./common');
const merge = require('merge');
const exec = require('child_process').exec;
const privKey = common.encrypt('crx.pem');

function generatePublicKey(privateKey) {
	const key = new RSA(privateKey);
	return key.exportKey('pkcs8-public-der');
}
function createCrx(fileContent) {
	return new Promise((resolve) => {
		const keyContent = fs.readFileSync(privKey);
		const publicKey = generatePublicKey(keyContent);
		const keyLength = publicKey.length;
		const signature = Buffer.from(
			crypto
			.createSign("sha1")
			.update(fileContent)
			.sign(keyContent),
			"binary"
		);
		const sigLength = signature.length;
		const zipLength = fileContent.length;
		const length = 16 + keyLength + sigLength + zipLength;
		const crx = Buffer.alloc(length);
		crx.write("Cr24" + new Array(13).join("\x00"), "binary");
		crx[4] = 2;
		crx.writeUInt32LE(keyLength, 8);
		crx.writeUInt32LE(sigLength, 12);
		publicKey.copy(crx, 16);
		signature.copy(crx, 16 + keyLength);
		fileContent.copy(crx, 16 + keyLength + sigLength);
		resolve(crx);
	});
}

module.exports = function(manifest, outputDir) {
	return new Promise(resolve => {
		// replace manifest
		const newManifest = merge(true, manifest);
		newManifest.update_url = common.config.chrome.update;
		fs.writeFileSync(common.manifest, JSON.stringify(newManifest));
		const zipPath = common.packFile('crx.zip');
		exec(`cd ${common.dist} && zip -r ${zipPath} ./*`, (error, stdout, stderr) => {
			if (error) {
				console.info('Error : ' + stderr);
				resolve();
			} else {
				createCrx(fs.readFileSync(zipPath))
				.then(content => {
					const out = path.resolve(outputDir, common.config.dist.replace('{VER}', common.version) + '.crx');
					fs.writeFileSync(out, content);
					fs.unlinkSync(zipPath);
					resolve(out);
				});
			}
		});
	});
}