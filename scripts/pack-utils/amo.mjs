import fs from 'fs/promises';
import path from 'path';
import { path as _path } from '../config.mjs';
import { copyDir, getWebExt } from '../utils.mjs';
import { createZip } from '../zip.mjs';

/**
 * Pack source code respecting .gitignore rules
 * @param {string} rootPath - Project root path
 * @returns {Promise<string>} - Path to the created source zip file
 */
async function packSourceCode(rootPath) {
  const tempDir = path.join(_path.temp, 'source-package');
  const sourceZipPath = path.join(_path.temp, 'source.zip');
  const clear = async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn('Could not clean up temporary directory:', err.message);
    }
  };
  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
    // Read .gitignore and create filter function
    const gitignorePath = path.join(rootPath, '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const ignorePatterns = gitignoreContent
      .split('\n')
      .map(line => line.trim().replace(/\/$/, ''))
      .filter(line => line && !line.startsWith('#'));
    // ignore other files
    ignorePatterns.push('.git');
    ignorePatterns.push('docs');
    ignorePatterns.push('tests');
    // console.log('ignorePatterns', ignorePatterns);
    // Simple function to check if a pattern with * matches a string
    const matchesPattern = (pattern, str) => {
      if (!pattern.includes('*')) {
        return pattern === str;
      }
      // Escape special regex characters except *
      const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      // Convert * to .* for regex matching
      const regexPattern = escapedPattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(str);
    };
    // Read all top-level entries in rootPath
    const entries = await fs.readdir(rootPath);
    for (const entry of entries) {
      if (entry.startsWith('dist_')) {
        continue;
      }
      // Check if this entry should be ignored
      const shouldIgnore = ignorePatterns.some(pattern =>
        matchesPattern(pattern, entry),
      );
      if (shouldIgnore) {
        continue;
      }
      const srcPath = path.join(rootPath, entry);
      const destPath = path.join(tempDir, entry);
      // Check if it's a file or directory
      const stat = await fs.stat(srcPath);
      if (stat.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
    // Create source code zip
    await createZip(tempDir, sourceZipPath);
    await clear();
    return sourceZipPath;
  } finally {
    await clear();
  }
}

export default async function ({
  rootPath,
  sourcePath,
  zipPath,
  extensionConfig,
}) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  // Pack source codes
  const uploadSourceCode = await packSourceCode(rootPath);

  const savedIdPath = path.join(rootPath, '.web-extension-id');
  const savedUploadUuidPath = path.join(rootPath, '.amo-upload-uuid');
  const { signAddon } = await getWebExt('lib/util/submit-addon.js');
  return await signAddon({
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    id: extensionConfig.id,
    xpiPath: zipPath,
    savedIdPath,
    savedUploadUuidPath,
    submissionSource: uploadSourceCode,
    channel: 'listed',
    metaDataJson: {
      version: {
        license: 'GPL-2.0-or-later',
        approval_notes:
          'https://github.com/FirefoxBar/HeaderEditor/blob/master/README.md',
      },
    },
  });
}
