import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { signAddon } from 'amo-upload';
import { last } from 'lodash-es';
import { path as _path, getVersion } from '../config.mjs';
import { copyDir, fileExists, getNote } from '../utils.mjs';
import { createZip } from '../zip.mjs';

let packingSourceCode = null;
/**
 * Pack source code respecting .gitignore rules
 * @param {string} rootPath - Project root path
 * @returns {Promise<string>} - Path to the created source zip file
 */
async function packSourceCode(rootPath) {
  const tempDir = path.join(_path.temp, 'source-package');
  const sourceZipPath = path.join(_path.temp, 'source.zip');
  if (await fileExists(sourceZipPath)) {
    return sourceZipPath;
  }
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

export const waitSubmit = [];
export async function submitAddon(
  rootPath,
  uploadSourceCode = false,
  options = {},
) {
  if (!process.env.AMO_KEY) {
    return Promise.reject(new Error('AMO_KEY not found'));
  }
  if (!process.env.AMO_SECRET) {
    return Promise.reject(new Error('AMO_SECRET not found'));
  }

  const time = Date.now();
  if (waitSubmit.length !== 0) {
    const s = last(waitSubmit) + 10000;
    if (s > time) {
      waitSubmit.push(s);
      await sleep(s - time);
    } else {
      waitSubmit.push(time);
    }
  } else {
    waitSubmit.push(time);
  }

  const opts = {
    apiKey: process.env.AMO_KEY,
    apiSecret: process.env.AMO_SECRET,
    approvalNotes: getNote(),
    override: false,
    pollInterval: 8000,
    pollRetry: 9999,
    pollRetryExisting: 9999,
    ...options,
  };

  // Pack source codes
  if (uploadSourceCode) {
    if (!packingSourceCode) {
      packingSourceCode = packSourceCode(rootPath);
    }
    opts.sourceFile = await packingSourceCode;
  }

  console.log(`[amo] [${options.addonId}] start signAddon`);
  return signAddon(opts);
}

export default async function ({
  rootPath,
  sourcePath,
  zipPath,
  extensionConfig,
}) {
  return submitAddon(rootPath, true, {
    addonId: extensionConfig.id,
    addonVersion: await getVersion(sourcePath),
    channel: 'listed',
    distFile: zipPath,
  });
}
