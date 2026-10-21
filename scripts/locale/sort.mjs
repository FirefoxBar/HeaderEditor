import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '../../locales');

export function sort(obj) {
  const objKeys = Object.keys(obj);
  objKeys.sort((k1, k2) => {
    let i = 0;
    while (i < k1.length - 1 && i < k2.length - 1 && k1[i] === k2[i]) {
      i++;
    }
    if (k1[i] === k2[i]) {
      return i < k1.length - 1 ? 1 : -1;
    } else {
      return k1[i].charCodeAt() > k2[i].charCodeAt() ? 1 : -1;
    }
  });
  const result = {};
  objKeys.forEach(k => (result[k] = obj[k]));
  return result;
}

async function exists(path) {
  try {
    await fs.access(path, fs.constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

async function main() {
  const langs = await fs.readdir(ROOT);

  for (const lang of langs) {
    const langPath = path.join(ROOT, lang, 'messages.json');
    if (!(await exists(langPath))) {
      continue;
    }
    const langJson = await fs.readFile(langPath, 'utf8');
    const langObj = JSON.parse(langJson);
    const sortedLangObj = sort(langObj);
    await fs.writeFile(langPath, JSON.stringify(sortedLangObj, null, 2), {
      encoding: 'utf8',
    });
    console.log(`Sort ${lang} success`);
  }
}

if (process.argv[1] === import.meta.filename) {
  main();
}
