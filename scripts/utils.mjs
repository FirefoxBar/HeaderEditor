import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';

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

export function getBMS() {
  const require = createRequire(import.meta.url);
  return require('@plasmohq/bms');
}
