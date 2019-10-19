const fs = require('fs');
const common = require('./common');
const dist = common.resolve(common.root, 'dist');

function rmdir(path, include_self) {
	const files = fs.readdirSync(path);
	files.forEach(file => {
		const fullpath = path + "/" + file;
		if (fs.statSync(fullpath).isDirectory()) {
			rmdir(fullpath, true);
			if (include_self) {
				fs.rmdirSync(fullpath);
			}
		} else {
			fs.unlinkSync(fullpath);
		}
	});
}
function copyDir(fromPath, toPath) {
	if (!fs.existsSync(toPath)) {
		fs.mkdirSync(toPath);
	}
	const files = fs.readdirSync(fromPath);
	files.forEach(file => {
		const fullpath = fromPath + "/" + file;
		if (fs.statSync(fullpath).isDirectory()) {
			copyDir(fullpath, toPath + "/" + file);
		} else {
			fs.copyFileSync(fullpath, toPath + "/" + file);
		}
	});
}

module.exports = function() {
	if (!fs.existsSync(dist)) {
		fs.mkdirSync(dist);
	}
	
	if (fs.existsSync(common.dist)) {
		rmdir(common.dist, false);
	} else {
		fs.mkdirSync(common.dist);
	}
	// Copy dist
	copyDir(dist, common.dist);
	
	if (fs.existsSync(common.pack)) {
		rmdir(common.pack, false);
	} else {
		fs.mkdirSync(common.pack);
	}
}
