import { after, before } from 'mocha';
import { cleanup, getBrowserClient, waitTestServer } from './utils.mjs';

function launchBrowser(browserKey) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout waiting for ${browserKey}`)),
      15000,
    );
  });
  const browserPromise = getBrowserClient(browserKey);
  return Promise.race([browserPromise, timeoutPromise]);
}

before(async function () {
  this.timeout(20000);
  const browserKeys = ['edge_v2', 'chrome_v3', 'firefox_v2', 'firefox_v3'];
  // const browserKeys = ['firefox_v2'];
  console.log('🚀 starting browser...');
  const firefoxBrowsers = browserKeys.filter(key => key.startsWith('firefox'));
  const chromeLikeBrowsers = browserKeys.filter(
    key => !key.startsWith('firefox'),
  );
  // launch Chrome browsers first
  if (chromeLikeBrowsers.length > 0) {
    await Promise.all(chromeLikeBrowsers.map(launchBrowser));
    console.log('✅ Chrome browsers ready');
  }
  // launch Firefox browsers first
  if (firefoxBrowsers.length > 0) {
    await Promise.all(firefoxBrowsers.map(launchBrowser));
    console.log('✅ Firefox browsers ready');
  }
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
