import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { nanoid } from 'nanoid';

export const testServer = 'http://127.0.0.1:8899/';
export const fxAddonUUID = 'f492d714-700a-4402-8b96-4ec9e829332d';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = (() => {
  const configPath = path.join(__dirname, 'config.json');
  if (!existsSync(configPath)) {
    return {};
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
})();

export async function waitTestServer() {
  // Check if test server is running
  while (true) {
    try {
      const res = await axios.get(`${testServer}health-check.php`, {
        timeout: 5000,
      });
      if (String(res.data).includes('It works!')) {
        break;
      }
      // Sleep 1 second
      await sleep(1000);
    } catch (error) {
      console.log('Test server is not running, retrying...', error);
      await sleep(1000);
    }
  }
}

export const randStr = () => String(nanoid());
