import assert from 'node:assert';
import {
  getHeader,
  getPageValue,
  runTest,
  saveRule,
  testServer,
} from './scripts/utils.mjs';

describe('Redirect', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const key = String(Math.random()).replace('.', '');

      const { remove } = await saveRule(browser.popup, {
        name: 'test redirect',
        ruleType: 'redirect',
        pattern: `^${testServer}get(\\d+)/(.*?)$`,
        matchType: 'regexp',
        isFunction: false,
        enable: true,
        to: `${testServer}get-query.php?id=$1&value=$2`,
      });

      const query = JSON.parse(
        await getPageValue(browser.browser, `get123/test${key}`),
      );

      assert.strictEqual(query['id'], '123');
      assert.strictEqual(query['value'], `test${key}`);

      await remove();
    },
  ));

describe('Modify Request Header', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const key = String(Math.random()).replace('.', '');

      const { remove } = await saveRule(browser.popup, {
        name: 'test modify request header',
        ruleType: 'modifySendHeader',
        pattern: '^' + testServer,
        matchType: 'regexp',
        isFunction: false,
        enable: true,
        action: {
          name: 'X-Test-Header',
          value: key,
        },
      });

      const header = await getHeader(browser.browser);

      assert.strictEqual(header['X_TEST_HEADER'], key);

      await remove();
    },
  ));

describe('Disable rule', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const key = String(Math.random()).replace('.', '');

      const { remove } = await saveRule(browser.popup, {
        name: 'test disable rule',
        ruleType: 'modifySendHeader',
        pattern: '^' + testServer,
        matchType: 'regexp',
        isFunction: false,
        enable: false,
        action: {
          name: 'X-Test-Header',
          value: key,
        },
      });

      const header = await getHeader(browser.browser);

      assert.strictEqual(header['X_TEST_HEADER'], undefined);

      await remove();
    },
  ));

describe('Remove Response Header', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const { remove } = await saveRule(browser.popup, {
        name: 'test remove request header',
        ruleType: 'modifyReceiveHeader',
        pattern: '^' + testServer,
        matchType: 'regexp',
        isFunction: false,
        enable: true,
        action: {
          name: 'content-security-policy',
          value: '_header_editor_remove_',
        },
      });

      const value = await getPageValue(browser.browser, 'csp.php');

      assert.strictEqual(value, 'Executed');

      await remove();
    },
  ));

describe('Modify Response Header', () =>
  runTest(
    ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'],
    async browser => {
      const key = String(Math.random()).replace('.', '');

      const { remove } = await saveRule(browser.popup, {
        name: 'test modify request header',
        ruleType: 'modifyReceiveHeader',
        pattern: '^' + testServer,
        matchType: 'regexp',
        isFunction: false,
        enable: true,
        action: {
          name: 'content-security-policy',
          value: `script-src 'self' 'nonce-${key}'`,
        },
      });

      const value = await getPageValue(browser.browser, 'csp.php?nonce=' + key);

      assert.strictEqual(value, key);

      await remove();
    },
  ));

describe('Custom Function', () =>
  runTest(['edge_v2', 'firefox_v2'], async browser => {
    const key = String(Math.random()).replace('.', '');

    const { remove } = await saveRule(browser.popup, {
      name: 'test custom function',
      ruleType: 'modifySendHeader',
      pattern: '^' + testServer,
      matchType: 'regexp',
      isFunction: true,
      enable: true,
      code: `val.push({ "name": "X-Custom-Header", "value": "${key}" })`,
    });

    const header = await getHeader(browser.browser);

    assert.strictEqual(header['X_CUSTOM_HEADER'], key);

    await remove();
  }));
