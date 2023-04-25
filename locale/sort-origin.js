const fs = require('fs');
const path = require('path');

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

let lang = require(path.join(__dirname, 'original/messages.json'));
lang = ksort(lang);
fs.writeFileSync(path.join(__dirname, 'original/messages.json'), JSON.stringify(lang, null, "\t"), {
  encoding: "utf8"
});
console.log("Sort success");