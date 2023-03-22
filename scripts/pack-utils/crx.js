const crypto = require('crypto');
const RSA = require('node-rsa');
const fse = require('fs-extra');
const config = require('../config');

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
    crypto
      .createSign('sha1')
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
  const fileContent = await fse.readFile(zipPath);
  const content = await createCrx(fileContent);
  const out = config.resolve(outputDir, `${config.extension.dist.replace('{VER}', config.version)}.crx`);
  await fse.writeFile(out, content);
  return out;
}

module.exports = packCrx;
