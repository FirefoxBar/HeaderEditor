import { readJSON } from 'fs-extra/esm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import extension from '../extension.json' with { type: 'json' };
import { getDistDir, getOutputFile } from './browser-config/get-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = join(__dirname, '..');

function getDistPath(browser) {
  return join(root, getDistDir(browser));
}

async function getVersion(path) {
  const manifest = await readJSON(join(path, 'manifest.json'));
  return manifest.version;
}

const temp = join(root, 'temp');
const pack = join(temp, 'dist-pack');
const release = join(temp, 'release');

export const scriptRoot = __dirname;
export const resolve = join;
export const path = { temp, root, pack, release };
export { join, extension, getDistPath, getDistDir, getOutputFile, getVersion };
