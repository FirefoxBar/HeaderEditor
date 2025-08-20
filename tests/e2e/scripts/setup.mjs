import { after, before } from 'mocha';
import { cleanup, getBrowserClient, sleep, waitTestServer } from './utils.mjs';

before(async function () {
  this.timeout(20000);
  // const browserKeys = ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'];
  const browserKeys = ['chrome_v3'];
  console.log('🚀 starting browser...');
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
  console.log('✅ browser ready');
  // Check if test server is running
  console.log('🚀 checking test server...');
  await waitTestServer();
  console.log('✅ test server ready');
});

after(async function () {
  this.timeout(5000);
  console.log('✅ Done');
  await cleanup();
});
