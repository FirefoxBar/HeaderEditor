import { version as _version, extension } from '../config.mjs';
import { signAddon } from 'sign-addon';

export default function (zipPath) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  return signAddon({
    xpiPath: zipPath,
    version: _version,
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extension.firefox.amo,
    disableProgressBar: true,
  });
};
