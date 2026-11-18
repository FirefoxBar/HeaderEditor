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
    ghApi: process.env.GITHUB_API_URL,
    ghRepo: process.env.GITHUB_REPOSITORY,
    ghToken: process.env.GITHUB_TOKEN,
    extName: 'header-editor',
    writeTo: filePath,
  });
};
