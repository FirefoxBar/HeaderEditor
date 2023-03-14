const fs = require('fs');
const path = require('path');
const request = require('request');
const merge = require('merge');

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

// Get default language
function main() {
  const outputDir = path.join(__dirname, 'output');
  const dir = fs.readdirSync(outputDir);

  // read basic language
  const basicLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, 'original/messages.json'), {
    encoding: "utf8"
  }));

  for (const lang of dir) {
    const langDir = path.join(outputDir, lang);
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }
      let currentLanguage = JSON.parse(fs.readFileSync(path.join(langDir, file), {
        encoding: "utf8"
      }));

      // sort
      currentLanguage = ksort(currentLanguage);

      Object.keys(basicLanguage).forEach(k => {
        // add not exists
        if (typeof currentLanguage[k] === 'undefined') {
          currentLanguage[k] = basicLanguage[k];
        }
        // add placeholder
        if (basicLanguage[k].placeholders) {
          currentLanguage[k].placeholders = basicLanguage[k].placeholders;
        }
      });

      Object.keys(currentLanguage).forEach(k => {
        // remove description
        delete currentLanguage[k].description;
      });

      fs.writeFileSync(path.join(langDir, file), JSON.stringify(currentLanguage), {
        encoding: "utf8"
      });
    }
  }
}

main();