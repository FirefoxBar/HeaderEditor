import { EdgeAddonsAPI } from '@plasmohq/edge-addons-api';

export default function ({ zipPath, extensionConfig }) {
  if (!process.env.MS_CLIENT_ID) {
    return Promise.reject(new Error('MS_CLIENT_ID not found'));
  }
  if (!process.env.MS_API_KEY) {
    return Promise.reject(new Error('MS_API_KEY not found'));
  }

  const client = new EdgeAddonsAPI({
    productId: extensionConfig.product_id,
    clientId: process.env.MS_CLIENT_ID,
    apiKey: process.env.MS_API_KEY,
  });

  return client.submit({
    filePath: zipPath,
    notes: 'https://github.com/FirefoxBar/HeaderEditor/blob/master/README.md',
  });
}
