const fs = require('fs');
const ligature2codepoint = require('./ligature2codepoint.json');

function main(file) {
	if (file.fullpath.substr(-5) === '.html') {
		// Replace iconfonts
		let f = fs.readFileSync(file.fullpath, 'utf-8');
		for (const k in ligature2codepoint) {
			f = f.replace(new RegExp('<i class="material-icons">' + k + '</i>', 'g'), '<i class="material-icons">&#x' + ligature2codepoint[k] + ';</i>');
		}
		return new Buffer(f);
	}
	return null;
}

module.exports = main;