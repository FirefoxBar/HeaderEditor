import fetch from 'node-fetch';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const token = process.env.TOKEN;

  if (!token) {
    return;
  }

  // read version from package.json
  const pkg = JSON.parse(await readFile(join(__dirname, '../package.json'), {
    encoding: 'utf-8',
  }));

  const params = new URLSearchParams();
  params.append('name', 'header-editor');
  params.append('ver', pkg.version);
  params.append('token', token);

  const resp = await fetch('https://ext.firefoxcn.net/api/snapshot.php?' + params.toString());
  const text = await resp.text();

  const filePath = join(__dirname, '../temp/snapshot-version.txt');
  if (/^(\d+)$/.test(text)) {
    await mkdir(join(__dirname, '../temp/'), {
      recursive: true,
    });
    await writeFile(filePath, text, {
      encoding: 'utf8',
    });
  }

  console.log('Got version: ' + text + ', wrote to: ' + filePath);
}

main();