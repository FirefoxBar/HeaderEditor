import fs from 'node:fs/promises';
import path from 'node:path';
import cpr from 'cpr';

/**
 * Check if a file exists
 * @param {*} fullPath
 * @returns
 */
export async function fileExists(fullPath) {
  try {
    await fs.access(fullPath, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Read a JSON file
 * @param {string} file - The path to the JSON file
 * @param {Object} [options] - Options for reading the file
 * @returns {Promise<any>} - The parsed JSON object
 */
export async function readJSON(file, options = {}) {
  const data = await fs.readFile(file, options.encoding || 'utf8');
  return JSON.parse(data);
}

/**
 * Write a JSON file, creating parent directories if needed
 * @param {string} file - The path to the JSON file
 * @param {any} data - The data to write
 * @param {Object} [options] - Options for writing the file
 * @returns {Promise<void>}
 */
export async function outputJSON(file, data, options = {}) {
  // Ensure the directory exists
  const dir = path.dirname(file);
  await fs.mkdir(dir, { recursive: true });

  // Stringify the data
  const jsonData = JSON.stringify(data, null, options.spaces || null);

  // Write the file
  await fs.writeFile(file, jsonData, options.encoding || 'utf8');
}

export function copyDir(source, target) {
  return new Promise((resolve, reject) => {
    cpr(
      source,
      target,
      {
        deleteFirst: true,
        overwrite: true,
        confirm: false,
      },
      (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      },
    );
  });
}

export function getNote() {
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (repo && runId) {
    return `https://github.com/${repo}/actions/runs/${runId}`;
  }
  return 'https://github.com/FirefoxBar/HeaderEditor/blob/master/README.md';
}
