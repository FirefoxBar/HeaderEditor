#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const BUNDLE_DIR = path.join(__dirname, '../dist');
const bundles = [
  'background.js',
  'popup.js',
  'options.js',
];

const regex = /\neval\("(.*?)"\)/g;

const removeEvals = (file) => {
  console.info(`Removing eval() from ${file}`);

  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if(err) {
        reject(err);
        return;
      }

      if(!regex.test(data)) {
        reject(`No CSP specific code found in ${file}.`);
        return;
      }

      data.replace(regex, (match, s1) => {
        let res = s1;
        res = res.replace(/\\n/g, "\n");
        res = res.replace(/\\r/g, "");
        res = res.replace(/\\"/g, '"');
        return res;
      })

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
    removeEvals(path.join(BUNDLE_DIR, bundle))
      .then(() => console.info(`Bundle ${bundle}: OK`))
      .catch(console.error);
  });
};

main();
