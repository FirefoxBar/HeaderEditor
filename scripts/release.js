const fs = require('fs');
const publishRelease = require('publish-release');
const package = require('../package.json');
const rootDir = fs.realpathSync(__dirname + '/../') + '/';
const output = rootDir + 'dist-pack/';
const GitHubUser = require(rootDir + 'encrypt/github.json');

if (!package.github.enable) {
	console.log("GitHub not enabled");
}

const assets = [];
const assetName = package.name + "-" + package.version;

if (fs.existsSync(output + assetName + '.crx')) {
	assets.push(output + assetName + '.crx');
}
if (fs.existsSync(output + assetName + '.xpi')) {
	assets.push(output + assetName + '.xpi');
}

// Get git names
const gitName = package.repository.url.match(/(\w+)\/(\w+)\.git/);
const tagName = package.github.tag.replace('{VER}', package.version);

publishRelease({
	token: GitHubUser.token,
	owner: gitName[1],
	repo: gitName[2],
	tag: tagName,
	name: package.version,
	notes: package.version,
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