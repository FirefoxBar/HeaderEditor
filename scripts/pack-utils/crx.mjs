import ChromeExtension from 'crx';
import { readFile, writeFile } from 'fs/promises';
import { resolve, extension, version } from '../config.mjs';

async function createCrx(fileContent) {
  const keyContent = process.env.CRX_PRIV_KEY;
  if (!keyContent) {
    throw new Error('CRX_PRIV_KEY not found');
  }
  const crx = new ChromeExtension({
    codebase: 'http://localhost:8000/myExtension.crx',
    privateKey: keyContent,
  });

  crx.loaded = true;

  const crxBuffer = await crx.pack(fileContent);

  return crxBuffer;
}

async function packCrx(zipPath, outputDir) {
  const fileContent = await readFile(zipPath);
  const content = await createCrx(fileContent);
  const out = resolve(outputDir, `${extension.dist.replace('{VER}', version)}.crx`);
  await writeFile(out, content);
  const idFile = resolve(outputDir, `${extension.dist.replace('{VER}', version)}.crx-id.txt`);
  await writeFile(idFile, extension.chrome.crx);
  return out;
}

export default packCrx;
