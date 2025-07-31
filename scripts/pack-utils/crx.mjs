import ChromeExtension from 'crx';
import { readFile, writeFile } from 'fs/promises';
import { getOutputFile, getVersion, join } from '../config.mjs';
import { outputJSON } from '../utils.mjs';

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
  extensionConfig,
) {
  const fileContent = await readFile(zipPath);
  if (typeof process.env[extensionConfig.priv_key] === 'undefined') {
    throw new Error(`${extensionConfig.priv_key} not found`);
  }
  const content = await createCrx(
    fileContent,
    process.env[extensionConfig.priv_key],
  );
  const fileName = getOutputFile(
    extensionConfig.browser,
    await getVersion(sourcePath),
    'crx',
  );
  const out = join(releasePath, fileName);
  await writeFile(out, content);

  const infoFile = join(releasePath, `${fileName}-config.json`);
  await outputJSON(infoFile, {
    id: extensionConfig.id,
    browser: browserConfig,
    extension: extensionConfig,
  });

  return out;
}

export default packCrx;
