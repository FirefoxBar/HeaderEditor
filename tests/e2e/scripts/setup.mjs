import { after, before } from 'mocha';
import { cleanup, getBrowserClient, waitTestServer } from './utils.mjs';

before(async function () {
  this.timeout(20000);
  const browserKeys = ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'];
  // const browserKeys = ['firefox_v2', 'chrome_v3'];
  console.log('🚀 starting browser...');
  for (const browserKey of browserKeys) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout waiting for ${browserKey}`)),
        15000,
      );
    });
    const browserPromise = getBrowserClient(browserKey);
    await Promise.race([browserPromise, timeoutPromise]);
  }
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
