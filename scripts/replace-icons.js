#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const icons = require('./icons.json');

const BUNDLE_DIR = path.join(__dirname, '../dist');
const bundles = [
	'popup/popup.js',
	'options/options.js',
];

const regex = /@icon\(([a-z_]+)\)/g;

const removeIcons = (file) => {
	console.info(`Removing icon name from ${file}`);

	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf8', (err, data) => {
			if(err) {
				reject(err);
				return;
			}

			if(!regex.test(data)) {
				resolve();
				return;
			}

			data = data.replace(regex, (_, p1) => {
				if (typeof(icons[p1]) === "undefined") {
					console.log(`icon ${p1} not found`);
					return p1;
				} else {
					return `&#x${icons[p1]};`;
				}
			});

			fs.writeFile(file, data, (err) => {
				if(err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	});
};

const main = () => {
	bundles.forEach(bundle => {
		removeIcons(path.join(BUNDLE_DIR, bundle))
			.then(() => console.info(`Bundle ${bundle}: OK`))
			.catch(console.error);
	});
};

main();
