import { join } from 'node:path';
import { root } from './config.mjs';

export const run = async ({ getSnapshotVersion }) => {
  const token = process.env.TOKEN;
  if (!token) {
    return;
  }

  if (process.env.INPUT_VERSION) {
    console.log('Has INPUT_VERSION, skip get snapshot');
    return;
  }

  const filePath = join(root, 'temp/version.txt');

  return await getSnapshotVersion({
    token,
    gitHubApi: process.env.GITHUB_API_URL,
    gitHubRepo: process.env.GITHUB_REPOSITORY,
    gitHubToken: process.env.GITHUB_TOKEN,
    extName: 'header-editor',
    writeTo: filePath,
  });
};
