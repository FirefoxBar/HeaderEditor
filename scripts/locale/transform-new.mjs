import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const TARGET_DIR = path.join(ROOT, 'temp', 'new-locale');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
}

function main() {
  const entries = fs.readdirSync(TARGET_DIR, { withFileTypes: true });
  const langs = entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .sort();

  let totalLangs = 0;
  for (const lang of langs) {
    const localeFile = path.join(TARGET_DIR, lang);
    const current = readJSON(localeFile);

    const first = current[Object.keys(current)[0]];
    if (typeof first !== 'string') {
      continue;
    }

    const newObj = {};
    for (const key of Object.keys(current)) {
      newObj[key] = {
        message: current[key],
      };
    }

    fs.writeFileSync(localeFile, JSON.stringify(newObj, null, 2), {
      encoding: 'utf8',
    });
    totalLangs += 1;
  }

  console.log(
    `done: langs=${totalLangs}, outDir=${path.relative(ROOT, TARGET_DIR)}`,
  );
}

main();
