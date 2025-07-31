import { EdgeWebstoreClient } from '@plasmo-corp/ewu';
// TODO: 使用@plasmohq/edge-addons-api

export default function (
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  extensionConfig,
) {
  if (!process.env.MS_CLIENT_ID) {
    return Promise.reject(new Error('MS_CLIENT_ID not found'));
  }
  if (!process.env.MS_CLIENT_SECRET) {
    return Promise.reject(new Error('MS_CLIENT_SECRET not found'));
  }
  if (!process.env.MS_ACCESS_TOKEN_URL) {
    return Promise.reject(new Error('MS_ACCESS_TOKEN_URL not found'));
  }

  const client = new EdgeWebstoreClient({
    productId: extensionConfig.product_id,
    clientId: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    accessTokenUrl: process.env.MS_ACCESS_TOKEN_URL,
  });

  return client.submit({
    filePath: zipPath,
    notes: 'release',
  });
}
