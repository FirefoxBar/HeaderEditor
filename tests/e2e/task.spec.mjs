import assert from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import { getTask, runTask, saveRule, saveTask } from './scripts/api.mjs';
import {
  getHeader,
  getPageValue,
  runInBrowsers,
  runTest,
} from './scripts/browser.mjs';
import { randStr, testServer } from './scripts/utils.mjs';

describe('Fetch task', () => {
  const key = `task_${randStr()}`;
  const value = randStr();
  const removes = [];
  before(() =>
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
  after(() => removes.map(remove => remove()));

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
          to: `${testServer}get-query.php?value={\$TASK.${key}.value}`,
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

  describe('Use in headers', () =>
    runTest(
      ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
      async browser => {
        const { remove } = await saveRule(browser.popup, {
          name: 'test modify request header',
          ruleType: 'modifySendHeader',
          condition: {
            urlPrefix: testServer,
          },
          isFunction: false,
          enable: true,
          action: {
            name: 'X-Test-Header',
            value: `X-{\$TASK.${key}.value}-Y`,
          },
        });

        try {
          const header = await getHeader(browser.browser);
          assert.strictEqual(header.X_TEST_HEADER, `X-${value}-Y`);
        } finally {
          await remove();
        }
      },
    ));
});
