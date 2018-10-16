const package = require('../package.json');
const arg = require('arg');
const fs = require('fs');
const buildXpi = require('./pack-utils/xpi');
const buildAmo = require('./pack-utils/amo');
const buildCws = require('./pack-utils/cws');
const buildCrx = require('./pack-utils/crx');

const args = arg({
    '--platform': String
});

const manifest = require('../src/manifest.json');
const output = fs.realpathSync(__dirname + '/../dist-pack/') + '/';
if (!fs.existsSync(output)) {
	fs.mkdirSync(output);
}

const isAuto = args["--platform"] ? false : true;
if (isAuto) {
	new Promise(resolve => {
		if (package.webextension.autobuild.xpi) {
			console.log("Building XPI");
			buildXpi(manifest, output).then(resolve);
		} else {
			resolve();
		}
	})
	.then(r => {
		console.log(r);
	})
	.then(r => new Promise(resolve => {
		if (package.webextension.autobuild.amo) {
			console.log("Building AMO");
			buildAmo(manifest).then(resolve);
		} else {
			resolve();
		}
	}))
	.then(r => new Promise(resolve => {
		if (package.webextension.autobuild.cwx) {
			console.log("Building Chrome Web Store");
			buildCws().then(resolve);
		} else {
			resolve();
		}
	}))
	.then(r => new Promise(resolve => {
		if (package.webextension.autobuild.crx) {
			console.log("Building CRX");
			buildCrx(manifest, output).then(resolve);
		} else {
			resolve();
		}
	}))
	.then(r => {
		console.log(r);
	});
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