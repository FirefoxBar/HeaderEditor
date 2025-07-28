import ChromeExtension from 'crx';
import { readFile, writeFile } from 'fs/promises';
import { getOutputFile, getVersion, join } from '../config.mjs';

async function createCrx(fileContent, keyContent) {
  if (!keyContent) {
    throw new Error('No priv key');
  }
  const crx = new ChromeExtension({
    codebase: 'http://localhost:8000/myExtension.crx',
    privateKey: keyContent,
  });

  crx.loaded = true;

  const crxBuffer = await crx.pack(fileContent);

  return crxBuffer;
}

async function packCrx(
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  itemConfig,
) {
  const fileContent = await readFile(zipPath);
  if (typeof process.env[itemConfig.priv_key] === 'undefined') {
    throw new Error(`${itemConfig.priv_key} not found`);
  }
  const content = await createCrx(
    fileContent,
    process.env[itemConfig.priv_key],
  );
  const fileName = getOutputFile(
    itemConfig.browser,
    await getVersion(sourcePath),
    'crx',
  );
  const out = join(releasePath, fileName);
  await writeFile(out, content);
  const idFile = join(releasePath, `${fileName}-id.txt`);
  await writeFile(idFile, itemConfig.id);
  return out;
}

export default packCrx;
