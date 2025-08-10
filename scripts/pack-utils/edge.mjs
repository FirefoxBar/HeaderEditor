import { getBMS } from '../utils.mjs';

const { submitEdge } = getBMS();

export default function ({ zipPath, extensionConfig }) {
  if (!process.env.MS_CLIENT_ID) {
    return Promise.reject(new Error('MS_CLIENT_ID not found'));
  }
  if (!process.env.MS_CLIENT_SECRET) {
    return Promise.reject(new Error('MS_CLIENT_SECRET not found'));
  }
  if (!process.env.MS_ACCESS_TOKEN_URL) {
    return Promise.reject(new Error('MS_ACCESS_TOKEN_URL not found'));
  }

  return submitEdge({
    productId: extensionConfig.product_id,
    clientId: process.env.MS_CLIENT_ID,
    apiKey: process.env.MS_API_KEY,
    zip: zipPath,
    notes: 'release',
    verbose: true,
  });
}
