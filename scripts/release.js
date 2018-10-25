const fs = require('fs');
const crypto = require('crypto');
const publishRelease = require('publish-release');
const package = require('../package.json');
const rootDir = fs.realpathSync(__dirname + '/../') + '/';
const output = rootDir + 'dist-pack/';
const GitHubUser = require(rootDir + 'encrypt/github.json');

if (!package.webextension.github.enable) {
	console.log("GitHub not enabled");
}

const assets = [];
let content = "";

const assetName = package.webextension.dist.replace('{VER}', package.version);

['crx', 'xpi'].forEach(extName => {
	if (fs.existsSync(output + assetName + '.' + extName)) {
		assets.push(output + assetName + '.' + extName);
		content += assetName + '.' + extName + ' sha256:';
		const buffer = fs.readFileSync(output + assetName + '.' + extName);
		const fsHash = crypto.createHash('sha256');
		fsHash.update(buffer);
		content += fsHash.digest('hex') + "\n";
	}
});

// Get git names
const gitName = package.repository.url.match(/(\w+)\/(\w+)\.git/);
const tagName = package.webextension.github.tag.replace('{VER}', package.version);

publishRelease({
	token: GitHubUser.token,
	owner: gitName[1],
	repo: gitName[2],
	tag: tagName,
	name: package.version,
	notes: content,
	draft: false,
	prerelease: false,
	reuseRelease: false,
	reuseDraftOnly: false,
	skipAssetsCheck: false,
	skipDuplicatedAssets: false,
	skipIfPublished: true,
	editRelease: false,
	deleteEmptyTag: false,
	assets: assets
}, function (err, release) {
	if (err) {
		console.error("release failed!");
		console.error(err);
	} else {
		console.log(release.html_url);
	}
})