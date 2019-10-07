const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '../..');
const dist = path.resolve(rootDir, 'dist');
const tmp = path.resolve(rootDir, 'build-temp');
const output = path.resolve(rootDir, 'dist-pack');

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
	
	if (fs.existsSync(tmp)) {
		rmdir(tmp, false);
	} else {
		fs.mkdirSync(tmp);
	}
	// Copy dist
	copyDir(dist, tmp + '/copy-dist');
	
	if (fs.existsSync(output)) {
		rmdir(output, false);
	} else {
		fs.mkdirSync(output);
	}
}
