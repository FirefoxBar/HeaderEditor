const config = require('./extension-config').config;
const arg = require('arg');
const path = require('path');
const check = require('./pack-utils/pack-check');
const buildXpi = require('./pack-utils/xpi');
const buildAmo = require('./pack-utils/amo');
const buildCws = require('./pack-utils/cws');
const buildCrx = require('./pack-utils/crx');

const args = arg({
    '--platform': String
});

check();
const dist = path.resolve(__dirname, "..", 'dist');
const manifest = require(path.resolve(dist, 'manifest.json'));
const output = path.resolve(__dirname, '..', 'dist-pack');

const isAuto = args["--platform"] ? false : true;

if (isAuto) {
	function XPI() {
		if (config.autobuild.xpi) {
			console.log("Building XPI");
			return buildXpi(manifest, output);
		} else {
			return Promise.resolve();
		}
	}
	function AMO() {
		if (config.autobuild.amo) {
			console.log("Building AMO");
			return buildAmo(manifest);
		} else {
			return Promise.resolve();
		}
	}
	function CWS() {
		if (config.autobuild.cwx) {
			console.log("Building Chrome Web Store");
			return buildCws();
		} else {
			return Promise.resolve();
		}
	}
	function CRX() {
		if (config.autobuild.crx) {
			console.log("Building CRX");
			return buildCrx(manifest, output);
		} else {
			return Promise.resolve();
		}
	}
	XPI()
	.then(console.log).catch(console.log)
	.then(() => AMO())
	.then(console.log).catch(console.log)
	.then(() => CWS())
	.then(console.log).catch(console.log)
	.then(() => CRX())
	.then(console.log).catch(console.log);
} else {
	switch (args["--platform"]) {
		case 'xpi':
			console.log("Building XPI");
			buildXpi(manifest, output).then(r => console.log(r));
			break;
		case 'amo':
			console.log("Building AMO");
			buildAmo(manifest).then(r => console.log(r));
			break;
		case 'cws':
			console.log("Building CWS");
			buildCws().then(r => console.log(r));
			break;
		case 'crx':
			console.log("Building CRX");
			buildCrx(manifest, output).then(r => console.log(r));
			break;
	}
}