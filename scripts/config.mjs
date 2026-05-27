import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import extension from '../extension.json' with { type: 'json' };
import { getDistDir, getOutputFile } from './browser-config/get-path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const root = join(__dirname, '..');

function getDistPath(browser) {
  return join(root, getDistDir(browser));
}

export const temp = join(root, 'temp');
export const releasePath = join(temp, 'release');
export const scriptRoot = __dirname;
export { extension, getDistPath, getDistDir, getOutputFile };
