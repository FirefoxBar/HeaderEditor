import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { omit } from 'lodash-es';
import { sort } from './sort.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const LOCALES_DIR = path.join(ROOT, 'locales');
const TARGET_DIR = path.join(ROOT, 'temp', 'new-locale');

async function exists(path) {
  try {
    await fs.access(path, fs.constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

async function readJSON(filePath) {
  return JSON.parse(await fs.readFile(filePath, { encoding: 'utf8' }));
}

async function transformAllInOne() {
  const EN = path.join(LOCALES_DIR, 'en', 'messages.json');
  const enMap = await readJSON(EN);

  const file = path.join(TARGET_DIR, 'all-in-one.json');
  const current = await readJSON(file);

  for (const key in current) {
    const originalLocale = path.join(LOCALES_DIR, key, 'messages.json');
    if (!(await exists(originalLocale))) {
      console.log(`[${key}] not found`);
      continue;
    }

    const original = await readJSON(originalLocale);
    for (const key2 in current[key]) {
      const message = current[key][key2];
      if (message) {
        original[key2] = {
          ...omit(enMap[key2], ['description']),
          message,
        };
      }
    }

    await fs.writeFile(
      originalLocale,
      JSON.stringify(sort(original), null, 2),
      {
        encoding: 'utf8',
      },
    );
  }

  console.log(
    `done: langs=${Object.keys(current).length}, outDir=${path.relative(ROOT, TARGET_DIR)}`,
  );
}

async function transformLangs() {
  const EN = path.join(LOCALES_DIR, 'en', 'messages.json');
  const enMap = await readJSON(EN);

  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true });
  const langs = entries
    .filter(e => e.isFile())
    .map(e => e.name.replace(/.json$/, ''))
    .sort();

  let totalLangs = 0;
  for (const lang of langs) {
    const originalLocale = path.join(LOCALES_DIR, lang, 'messages.json');
    if (!(await exists(originalLocale))) {
      console.log(`[${lang}] not found`);
      continue;
    }

    const newLocaleFile = path.join(TARGET_DIR, `${lang}.json`);
    const newLocale = await readJSON(newLocaleFile);

    const original = await readJSON(originalLocale);
    for (const key2 in newLocale) {
      const message =
        typeof newLocale[key2] === 'string'
          ? newLocale[key2]
          : newLocale[key2].message;
      if (message) {
        original[key2] = {
          ...omit(enMap[key2], ['description']),
          message,
        };
      }
    }

    await fs.writeFile(
      originalLocale,
      JSON.stringify(sort(original), null, 2),
      {
        encoding: 'utf8',
      },
    );
    totalLangs += 1;
  }

  console.log(
    `done: langs=${totalLangs}, outDir=${path.relative(ROOT, TARGET_DIR)}`,
  );
}

function main() {
  const isAllInOne = process.argv.some(x => x === '--all-in-one');

  if (isAllInOne) {
    return transformAllInOne();
  } else {
    return transformLangs();
  }
}

main();
