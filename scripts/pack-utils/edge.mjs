import { createReadStream } from 'node:fs';
import { EdgeAddonsAPI } from '@plasmohq/edge-addons-api';

export default async function ({ zipPath, extensionConfig }) {
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

  const uploadResp = await client.upload(createReadStream(zipPath));
  console.log('[edge] upload done', uploadResp);
  const uploadStatus = await client.waitForUpload(uploadResp);
  console.log('[edge] upload check success', uploadStatus);
  const publishResp = await client.publish(
    'https://github.com/FirefoxBar/HeaderEditor/blob/master/README.md',
  );
  console.log('[edge] publish done', publishResp);
  return client.getPublishStatus(publishResp);
}
