import assert from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import { getTask, saveTask } from './scripts/api.mjs';
import { runTest } from './scripts/browser.mjs';
import { testServer } from './scripts/utils.mjs';

describe('Run task', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const key = `task_${randStr()}`;
      const value = randStr();

      const { remove } = await saveTask(browser.popup, {
        key,
        name: 'test task 1',
        isFunction: false,
        fetch: {
          url: `${testServer}mock-json.php?value=${value}`,
          method: 'GET',
        },
      });

      try {
        await runTask(browser.popup, key);
        await sleep(100);
        const result = await getTask(browser.popup, key);
        assert.strictEqual(result.lastRun.status, 'done');
        assert.strictEqual(result.lastRun.result.value, value);
      } finally {
        await remove();
      }
    },
  ));
