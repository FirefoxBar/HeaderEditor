import assert from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import { getTask, runTask, saveTask } from './scripts/api.mjs';
import { runInBrowsers, runTest } from './scripts/browser.mjs';
import { randStr, testServer } from './scripts/utils.mjs';

describe('Fetch task', () => {
  const key = `task_${randStr()}`;
  const value = randStr();
  const removes = [];
  beforeAll(() =>
    runInBrowsers(
      ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
      async browser => {
        const res = await saveTask(browser.popup, {
          key,
          name: 'test task 1',
          isFunction: false,
          fetch: {
            url: `${testServer}mock-json.php?value=${value}`,
            method: 'GET',
            responseType: 'json',
          },
        });
        removes.push(res.remove);
      },
    ),
  );
  afterAll(() => removes.forEach(remove => remove()));

  describe('Get task result', () =>
    runTest(
      ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
      async browser => {
        await runTask(browser.popup, key);
        await sleep(100);
        const result = await getTask(browser.popup, key);
        assert.strictEqual(result.lastRun.status, 'done');
        assert.deepStrictEqual(result.lastRun.result, { value });
      },
    ));

  describe('Use in redirect', () =>
    runTest(
      ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
      async browser => {
        const { remove } = await saveRule(browser.popup, {
          name: 'test redirect',
          ruleType: 'redirect',
          pattern: `^${testServer}get(\\d+)$`,
          matchType: 'regexp',
          isFunction: false,
          enable: true,
          to: `${testServer}get-query.php?value=\${TASK.${key}.value}`,
        });

        try {
          const query = JSON.parse(
            await getPageValue(browser.browser, `get123`),
          );
          assert.strictEqual(query.value, value);
        } finally {
          await remove();
        }
      },
    ));
});
