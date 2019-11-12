const fs = require('fs');
const path = require('path');
const request = require('request');
const merge = require('merge');

if (typeof(process.env["TRANSIFEX_TOKEN"]) === "undefined") {
	return;
}

const project = {
	name: "header-editor",
	user: "api",
	token: process.env.TRANSIFEX_TOKEN,
	default: "en",
	langs: ["zh_CN", "zh_TW", "pl", "pt_BR"]
}
const outputDir = path.resolve(__dirname, '../../dist/_locales');
const placeholder = require('./placeholder.json')

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir);
}

function requestTransifex(api) {
	return new Promise((resolve) => {
		request.get({
			"url": "https://www.transifex.com/api/2/" + api,
			"auth": {
				"user": project.user,
				"pass": project.token
			}
		}, (err, data, body) => {
			resolve(JSON.parse(body));
		});
	});
}
function ksort(obj) {
	let objKeys = Object.keys(obj);
	objKeys.sort((k1, k2) => {
		let i = 0;
		while (i < (k1.length - 1) && i < (k2.length - 1) && k1[i] === k2[i]) {
			i++;
		}
		if (k1[i] === k2[i]) {
			return i < (k1.length - 1) ? 1 : -1;
		} else {
			return k1[i].charCodeAt() > k2[i].charCodeAt() ? 1 : -1;
		}
	});
	let result = {};
	objKeys.forEach(k => result[k] = obj[k]);
	return result;
}
function addPlaceholders(obj) {
	// Add placeholders
	for (const k in placeholder) {
		if (typeof(obj[k]) !== 'undefined') {
			obj[k].placeholders = merge(true, placeholder[k]);
		} else {
			console.log("%s not exists, please check it", k);
		}
	}
}
function writeOneLanguage(obj, lang, default_language) {
	const newObj = merge(true, obj);
	for (const k in newObj) {
		// remove description
		delete newObj[k]["description"];
	}
	if (typeof(default_language) !== 'undefined') {
		// set english words to it if it is empty
		for (const k in newObj) {
			if (newObj[k].message === '') {
				newObj[k].message = default_language[k].message;
			}
		}
	}
	addPlaceholders(newObj);
	const langDir = path.join(outputDir, lang);
	if (!fs.existsSync(langDir)) {
		fs.mkdirSync(langDir);
	}
	fs.writeFileSync(path.join(langDir, "messages.json"), JSON.stringify(newObj), {
		encoding: "utf8"
	});
}

// Get default language
requestTransifex('project/' + project.name + '/resource/messages/translation/' + project.default + '/')
.then(r => {
	const default_language = ksort(JSON.parse(r.content));
	writeOneLanguage(default_language, project.default);
	console.log(`Write ${project.default} ok`);
	project.langs.forEach(lang => {
		requestTransifex('project/' + project.name + '/resource/messages/translation/' + lang + '/')
		.then(rs => {
			const content = ksort(JSON.parse(rs.content));
			writeOneLanguage(content, lang, default_language);
			console.log(`Write ${lang} ok`);
		})
		.catch(e => {
			console.log(e);
		})
	});
});