import { getBMS } from '../utils.mjs';

const { submitChrome } = getBMS();

async function packCws({ zipPath, extensionConfig }) {
  if (!process.env.CWS_CLIENT_ID) {
    return Promise.reject(new Error('CWS_CLIENT_ID not found'));
  }
  if (!process.env.CWS_CLIENT_SECRET) {
    return Promise.reject(new Error('CWS_CLIENT_SECRET not found'));
  }
  if (!process.env.CWS_TOKEN) {
    return Promise.reject(new Error('CWS_TOKEN not found'));
  }

  const id = extensionConfig.id;

  return submitChrome({
    extId: id,
    refreshToken: process.env.CWS_TOKEN,
    clientId: process.env.CWS_CLIENT_ID,
    clientSecret: process.env.CWS_CLIENT_SECRET,
    zip: zipPath,
    verbose: false,
  });
}

export default packCws;
