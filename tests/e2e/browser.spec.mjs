import { saveRule, getHeader, getPageValue, getResponseHeader, startUp, testServer, waitTestServer } from './utils.mjs';

let browser;

beforeAll(async () => {
  browser = await startUp('chrome_v3');
  // Check if test server is running
  await waitTestServer();
  // console.log('browser', browser);
}, 20000);

afterAll(async () => {
  if (browser) {
    await browser.popup.close();
    await browser.browser.close();
  }
});

test('Modify Request Header', async () => {
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

  expect(header['X_TEST_HEADER']).toBe(key);

  await remove();
});

test('Disable rule', async () => {
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

  expect(header['X_TEST_HEADER']).toBeUndefined();

  await remove();
});

test('Remove Response Header', async () => {
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

  expect(value).toBe('Executed');

  await remove();
});

test('Modify Response Header', async () => {
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

  expect(value).toBe(key);

  await remove();
});
