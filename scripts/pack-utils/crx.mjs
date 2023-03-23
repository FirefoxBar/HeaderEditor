import { createSign } from 'crypto';
import RSA from 'node-rsa';
import { readFile, writeFile } from 'fs/promises';
import { resolve, extension, version } from '../config.mjs';

function generatePublicKey(privateKey) {
  const key = new RSA(privateKey);
  return key.exportKey('pkcs8-public-der');
}

async function createCrx(fileContent) {
  const keyContent = process.env.CRX_PRIV_KEY;
  if (!keyContent) {
    throw new Error('CRX_PRIV_KEY not found');
  }
  const publicKey = generatePublicKey(keyContent);
  const keyLength = publicKey.length;
  const signature = Buffer.from(
    createSign('sha1')
      .update(fileContent)
      .sign(keyContent),
    'binary',
  );
  const sigLength = signature.length;
  const zipLength = fileContent.length;
  const length = 16 + keyLength + sigLength + zipLength;
  const crx = Buffer.alloc(length);
  crx.write(`Cr24${new Array(13).join('\x00')}`, 'binary');
  crx[4] = 2;
  crx.writeUInt32LE(keyLength, 8);
  crx.writeUInt32LE(sigLength, 12);
  publicKey.copy(crx, 16);
  signature.copy(crx, 16 + keyLength);
  fileContent.copy(crx, 16 + keyLength + sigLength);

  return crx;
}

async function packCrx(zipPath, outputDir) {
  const fileContent = await readFile(zipPath);
  const content = await createCrx(fileContent);
  const out = resolve(outputDir, `${extension.dist.replace('{VER}', version)}.crx`);
  await writeFile(out, content);
  return out;
}

export default packCrx;
