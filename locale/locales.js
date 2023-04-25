const fs = require('fs');
const path = require('path');

const ORIGINAL_NAME = 'en';
const originalDir = path.join(__dirname, 'original');
const outputDir = path.join(__dirname, 'output');

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

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, {
    encoding: "utf8"
  }));
}

let _basicLanguage = {};
function getBasicLanguage(fileName) {
  if (typeof _basicLanguage[fileName] === 'undefined') {
    _basicLanguage[fileName] = readJSON(path.join(originalDir, fileName));
  }
  return _basicLanguage[fileName];
}

// Get default language
function main() {
  const dir = fs.readdirSync(outputDir);

  for (const lang of dir) {
    const langDir = path.join(outputDir, lang);
    // skip not a dir
    const stat = fs.statSync(langDir);
    if (!stat.isDirectory()) {
      console.log("[" + lang + "] skip");
      continue;
    }

    // get detail messages
    const files = fs.readdirSync(langDir);
    for (const file of files) {
      if (!file.endsWith('.json')) {
        console.log("[" + lang + "/" + file + "] skip file");
        continue;
      }

      console.log("[" + lang + "/" + file + "] read file");
      const basicLanguage = getBasicLanguage(file);
      const orignalCurrentLanguage = readJSON(path.join(langDir, file));
      // sort
      const currentLanguage = ksort(orignalCurrentLanguage);

      Object.keys(basicLanguage).forEach(k => {
        // add not exists
        if (typeof currentLanguage[k] === 'undefined') {
          console.log("[" + lang + "/" + file + "] add default locale: " + k);
          currentLanguage[k] = basicLanguage[k];
        }
        // add placeholder
        if (basicLanguage[k].placeholders) {
          console.log("[" + lang + "/" + file + "] add placeholder: " + k);
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
      console.log("[" + lang + "/" + file + "] write ok");
    }
  }

  // Copy original language
  const files = fs.readdirSync(originalDir);
  const originalOutput = path.join(outputDir, ORIGINAL_NAME);
  if (!fs.existsSync(originalOutput)) {
    fs.mkdirSync(originalOutput, {
      recursive: true,
    });
  }
  for (const file of files) {
    const basicLanguage = getBasicLanguage(file);
    // sort
    const currentLanguage = ksort(basicLanguage);
    Object.keys(currentLanguage).forEach(k => {
      // remove description
      delete currentLanguage[k].description;
    });
    fs.writeFileSync(path.join(originalOutput, file), JSON.stringify(currentLanguage), {
      encoding: "utf8"
    });
    console.log("[" + ORIGINAL_NAME + "/" + file + "] write ok");
  }
}

main();