import assert from 'node:assert';
import {
  callBackgroundApi,
  getPageValue,
  runTest,
  saveRule,
  testServer,
} from './scripts/utils.mjs';

describe('Disable Modify Response', () =>
  runTest(['edge_v2', 'chrome_v3', 'firefox_v2'], async browser => {
    const key1 = String(Math.random()).replace('.', '');
    const key2 = String(Math.random()).replace('.', '');

    const { remove } = await saveRule(browser.popup, {
      enable: true,
      ruleType: 'modifyReceiveBody',
      isFunction: false,
      name: 'test modify response',
      condition: {
        url: `${testServer}mock-js.php`,
      },
      body: {
        stage: 'Response',
        value: `document.getElementById("value").value='${key1}';`,
      },
      encoding: 'UTF-8',
    });

    try {
      await callBackgroundApi(browser.popup, {
        method: 'set_pref',
        key: 'modify-body',
        value: false,
      });

      const value = await getPageValue(
        browser.browser,
        `js-src.php?value=${key2}`,
      );
      assert.strictEqual(value, key2);
    } finally {
      await remove();
    }
  }));

describe('Modify Response', () =>
  runTest(['edge_v2', 'chrome_v3', 'firefox_v2'], async browser => {
    const key1 = String(Math.random()).replace('.', '');
    const key2 = String(Math.random()).replace('.', '');

    await callBackgroundApi(browser.popup, {
      method: 'set_pref',
      key: 'modify-body',
      value: true,
    });

    const { remove } = await saveRule(browser.popup, {
      enable: true,
      ruleType: 'modifyReceiveBody',
      isFunction: false,
      name: 'test modify response',
      condition: {
        url: `${testServer}mock-js.php`,
      },
      body: {
        stage: 'Response',
        value: `document.getElementById("value").value='${key1}';`,
      },
      encoding: 'UTF-8',
    });

    try {
      const value1 = await getPageValue(browser.browser, 'js-src.php');
      assert.strictEqual(value1, key1);

      const value2 = await getPageValue(
        browser.browser,
        `js-src.php?value=${key2}`,
      );
      assert.strictEqual(value2, key2);
    } finally {
      await remove();
    }
  }));

describe('Modify Response - Custom Function', () =>
  runTest(['edge_v2', 'firefox_v2'], async browser => {
    const key1 = String(Math.random()).replace('.', '');
    const key2 = String(Math.random()).replace('.', '');

    await callBackgroundApi(browser.popup, {
      method: 'set_pref',
      key: 'modify-body',
      value: true,
    });

    const { remove } = await saveRule(browser.popup, {
      enable: true,
      ruleType: 'modifyReceiveBody',
      isFunction: true,
      name: 'test modify response with custom function',
      condition: {
        urlPrefix: `${testServer}mock-js.php`,
      },
      body: {
        stage: 'Response',
      },
      code: `return val.replace(/'(.*?)'/, '"${key1}$1${key1}$1"');`,
      encoding: 'UTF-8',
    });

    try {
      const value = await getPageValue(
        browser.browser,
        `js-src.php?value=${key2}`,
      );
      assert.strictEqual(value, `${key1}${key2}${key1}${key2}`);
    } finally {
      await remove();
    }
  }));
