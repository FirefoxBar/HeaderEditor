import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readJSONSync(fullPath) {
  return JSON.parse(readFileSync(fullPath, {
    encoding: 'utf8'
  }));
}

const root = join(__dirname, '..');
const dist = join(root, 'dist');

const extension = readJSONSync(join(root, 'extension.json'));
const manifest = readJSONSync(join(dist, 'manifest.json'));

const temp = join(root, 'temp');
const pack = join(temp, 'dist-pack');
const release = join(temp, 'release');

export const version = manifest.version;
export const resolve = join;
export const path = { temp, root, dist, pack, release };
export { extension };
