import {
  cleanup,
  getBrowserClient,
  getHeader,
  getPageValue,
  runTest,
  saveRule,
  testServer,
  waitTestServer,
} from './utils.mjs';

beforeAll(async () => {
  const browserKeys = ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'];
  const browserPromises = browserKeys.map(async browserKey => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout waiting for ${browserKey}`)),
        15000,
      );
    });
    const browserPromise = getBrowserClient(browserKey);
    return Promise.race([browserPromise, timeoutPromise]);
  });
  await Promise.all(browserPromises);
  console.log('browser ready');

  // Check if test server is running
  await waitTestServer();
  console.log('test server ready');
}, 20000);

afterAll(async () => {
  await cleanup();
});

test.each([['edge_v2'], ['chrome_v3'], ['firefox_v2'], ['firefox_v3']])(
  '[%s] - Redirect',
  async browserKey =>
    runTest(browserKey, async browser => {
      const key = String(Math.random()).replace('.', '');

      const { remove } = await saveRule(browser.popup, {
        name: 'test redirect',
        ruleType: 'redirect',
        pattern: `^${testServer}get(\\d+)/(.*?)$`,
        matchType: 'regexp',
        isFunction: false,
        enable: true,
        to: `${testServer}/get-query.php?id=$1&value=$2`,
      });

      const query = JSON.parse(
        await getPageValue(browser.browser, `get123/test${key}`),
      );

      expect(query['id']).toBe('123');
      expect(query['value']).toBe(`test${key}`);

      await remove();
    }),
);

test.each([['edge_v2'], ['chrome_v3'], ['firefox_v2'], ['firefox_v3']])(
  '[%s] - Modify Request Header',
  async browserKey =>
    runTest(browserKey, async browser => {
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
    }),
);

test.each([['edge_v2'], ['chrome_v3'], ['firefox_v2'], ['firefox_v3']])(
  '[%s] - Disable rule',
  async browserKey =>
    runTest(browserKey, async browser => {
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
    }),
);

test.each([['edge_v2'], ['chrome_v3'], ['firefox_v2'], ['firefox_v3']])(
  '[%s] - Remove Response Header',
  async browserKey =>
    runTest(browserKey, async browser => {
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
    }),
);

test.each([['edge_v2'], ['chrome_v3'], ['firefox_v2'], ['firefox_v3']])(
  '[%s] - Modify Response Header',
  async browserKey =>
    runTest(browserKey, async browser => {
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
    }),
);

test.each([['edge_v2'], ['firefox_v2']])(
  '[%s] - Custom Function',
  async browserKey =>
    runTest(browserKey, async browser => {
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

      expect(header['X_CUSTOM_HEADER']).toBe(key);

      await remove();
    }),
);
