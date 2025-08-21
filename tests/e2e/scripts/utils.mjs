import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import axios from 'axios';
import getPort from 'get-port';
import puppeteer from 'puppeteer';
import resolve from 'resolve';

export const testServer = 'http://127.0.0.1:8899/';
export const fxAddonUUID = 'f492d714-700a-4402-8b96-4ec9e829332d';

const browserList = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = (() => {
  const configPath = path.join(__dirname, 'config.json');
  if (!existsSync(configPath)) {
    return {};
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
})();

function getExecutablePath(name) {
  const path = process.env.PATH.split(':');
  for (const p of path) {
    const fullPath = path.join(p, name);
    if (existsSync(fullPath)) {
      console.log(`Found ${name} at ${fullPath}`);
      return fullPath;
    }
  }
}

async function createBrowser(browserKey, pathToExtension) {
  const browserType =
    browserKey.indexOf('firefox') === 0 ? 'firefox' : 'chrome';

  if (browserType === 'firefox') {
    const manifest = await readFile(
      path.join(pathToExtension, 'manifest.json'),
      'utf8',
    );
    const addonID = JSON.parse(manifest).browser_specific_settings.gecko.id;
    const pResolve = promisify(resolve);
    const webExtRoot = await pResolve('web-ext');
    const { connect } = await import(
      'file://' + path.join(path.dirname(webExtRoot), 'lib/firefox/remote.js')
    );

    const rppPort = await getPort();
    const browser = await puppeteer.launch({
      // headless: false,
      browser: 'firefox',
      executablePath: config.firefoxPath ? config.firefoxPath : undefined,
      args: [`--start-debugger-server=${rppPort}`],
      extraPrefsFirefox: {
        'devtools.chrome.enabled': true,
        'devtools.debugger.prompt-connection': false,
        'devtools.debugger.remote-enabled': true,
        'toolkit.telemetry.reportingpolicy.firstRun': false,
        'extensions.webextensions.uuids': `{"${addonID}": "${fxAddonUUID}"}`,
      },
    });
    const rdp = await connect(rppPort);
    await rdp.installTemporaryAddon(pathToExtension);
    return browser;
  } else {
    let executablePath;
    if (browserKey.startsWith('edge_')) {
      if (config.edgePath) {
        executablePath = config.edgePath;
      } else if (process.env.EDGE_PATH) {
        executablePath = process.env.EDGE_PATH;
      } else {
        executablePath = getExecutablePath('microsoft-edge');
      }
    } else if (config.chromePath) {
      executablePath = config.chromePath;
    }

    return puppeteer.launch({
      executablePath,
      // headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
    });
  }
}

export async function getBrowserClient(browserKey) {
  if (typeof browserList[browserKey] !== 'undefined') {
    return browserList[browserKey];
  }

  let extDir = `dist_${browserKey}`;
  if (browserKey.startsWith('edge_')) {
    extDir = `dist_${browserKey.replace('edge_', 'chrome_')}`;
  }

  const pathToExtension = path.join(__dirname, `../../../${extDir}`);

  const manifest = JSON.parse(
    readFileSync(path.join(pathToExtension, 'manifest.json'), 'utf8'),
  );

  const browser = await createBrowser(browserKey, pathToExtension);

  const openPopup = async baseTarget => {
    await sleep(1000);
    let url = `moz-extension://${fxAddonUUID}/popup.html`;
    if (baseTarget) {
      url = await baseTarget.evaluate('chrome.runtime.getURL("popup.html")');
    }
    const page = await browser.newPage();
    if (url.startsWith('moz-extension://')) {
      // Firefox will not resolve goto
      page.goto(url, { timeout: 0 }).catch(() => {
        // ignore
      });
      await sleep(300);
    } else {
      await page.goto(url);
    }
    await page.waitForSelector('#root');
    return page;
  };

  if (!browserKey.startsWith('firefox')) {
    // Chrome like
    if (manifest.background.scripts) {
      const backgroundPageTarget = await browser.waitForTarget(
        target => target.type() === 'background_page',
      );
      const page = await backgroundPageTarget.page();
      const popup = await openPopup(page);
      browserList[browserKey] = {
        browserType: 'chrome',
        type: 'page',
        target: page,
        browser,
        popup,
      };
      return browserList[browserKey];
    }

    if (manifest.background.service_worker) {
      const workerTarget = await browser.waitForTarget(
        // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
        target =>
          target.type() === 'service_worker' &&
          target.url().endsWith('background.js'),
      );
      const worker = await workerTarget.worker();
      const popup = await openPopup(worker);
      browserList[browserKey] = {
        browserType: 'chrome',
        type: 'worker',
        target: worker,
        browser,
        popup,
      };
      return browserList[browserKey];
    }
  } else {
    // Firefox has no 'background_page' target
    const popup = await openPopup();
    browserList[browserKey] = {
      browserType: 'firefox',
      type: 'none',
      browser,
      popup,
    };
    return browserList[browserKey];
  }
}

export async function cleanup() {
  for (const client of Object.values(browserList)) {
    try {
      if (client.popup && !client.popup.isClosed()) {
        await client.popup.close();
      }
      if (client.browser.isConnected()) {
        await client.browser.close();
      }
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  }
}

export async function waitTestServer() {
  // Check if test server is running
  while (true) {
    try {
      const res = await axios.get(`${testServer}health-check.php`, {
        timeout: 5000,
      });
      if (String(res.data).includes('It works!')) {
        break;
      }
      // Sleep 1 second
      await sleep(1000);
    } catch (error) {
      console.log('Test server is not running, retrying...', error);
      await sleep(1000);
    }
  }
}

export function runTest(keys, cb) {
  for (const key of keys) {
    it(key, () => {
      const client = browserList[key];
      if (!client) {
        return Promise.resolve();
      }
      return cb(client);
    });
  }
}

export function callBackgroundApi(popup, action) {
  return popup.evaluate(
    `browser.runtime.sendMessage(${JSON.stringify(action)})`,
  );
}

export async function saveRule(popup, rule) {
  const resp = await callBackgroundApi(popup, {
    method: 'save_rule',
    rule,
  });
  let tabName = '';
  switch (rule.ruleType) {
    case 'cancel':
    case 'redirect':
      tabName = 'request';
      break;
    case 'modifySendHeader':
      tabName = 'sendHeader';
      break;
    case 'modifyReceiveHeader':
      tabName = 'receiveHeader';
      break;
    case 'modifyReceiveBody':
      tabName = 'receiveBody';
      break;
    default:
      break;
  }

  return {
    id: resp.id,
    remove: () =>
      callBackgroundApi(popup, {
        method: 'del_rule',
        id: resp.id,
        type: tabName,
      }),
  };
}

export async function getPageValue(browser, url) {
  const page = await browser.newPage();
  await page.goto(`${testServer}${url}`);
  await page.waitForSelector('#value');
  await sleep(500);
  const value = await page.$eval('#value', el => el.value);
  await page.close();
  return value;
}

export async function getHeader(browser) {
  const value = await getPageValue(browser, 'get-header.php');
  return JSON.parse(value);
}

export async function getQuery(browser, rawQuery) {
  const value = await getPageValue(browser, 'get-query.php?' + rawQuery);
  return JSON.parse(value);
}

export async function getResponseHeader(browser, defaultHeader) {
  const page = await browser.newPage();
  const u = new URLSearchParams(defaultHeader);
  return new Promise(resolve => {
    page
      .waitForResponse(resp => resp.url().includes('mock-header.php'))
      .then(resp => {
        resolve(resp.headers());
      });
    page.goto(`${testServer}mock-header.php?${u.toString()}`);
  });
}
