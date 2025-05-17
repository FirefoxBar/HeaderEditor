import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import getPort from 'get-port';
import { cmd } from 'web-ext';
import axios from 'axios';

export const testServer = 'http://127.0.0.1:8899/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = (() => {
  const configPath = path.join(__dirname, 'config.json');
  if (!existsSync(configPath)) {
    return {};
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
})();

export async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getExecutablePath(name) {
  const path = process.env.PATH.split(':');
  for (const p of path) {
    const fullPath = path.join(p, name);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
}

function getChrome() {
  if (config.chromePath) {
    return config.chromePath;
  }
  if (typeof process.env.CHROME_BIN === 'string') {
    return process.env.CHROME_BIN;
  }
  return getExecutablePath('google-chrome');
}

function getFirefox() {
  if (config.firefoxPath) {
    return config.firefoxPath;
  }
  return getExecutablePath('firefox');
}

async function createBrowser(browserKey, pathToExtension) {
  const browserType = browserKey.indexOf('firefox') === 0 ? 'firefox' : 'chrome';

  if (browserType === 'firefox') {
    const port = await getPort();
    const runner = await cmd.run(
      {
        sourceDir: pathToExtension,
        firefox: getFirefox(),
        args: [`--remote-debugging-port=${port}`],
      },
      {
        shouldExitProgram: false,
      },
    );
    // const { debuggerPort } = runner.extensionRunners[0].runningInfo;
    // console.log(debuggerPort);
    return puppeteer.connect({
      browserWSEndpoint: `ws://localhost:${port}`,
    });
  } else {
    return puppeteer.launch({
      executablePath: getChrome(),
      headless: false,
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
  }
}

export async function startUp(browserKey) {
  const pathToExtension = path.join(__dirname, `../../dist_${browserKey}`);

  const manifest = JSON.parse(readFileSync(path.join(pathToExtension, 'manifest.json'), 'utf8'));

  const browser = await createBrowser(browserKey, pathToExtension);

  const openPopup = async (baseTarget) => {
    await sleep(1000);
    const url = await baseTarget.evaluate('chrome.runtime.getURL("popup.html")');
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('#ice-container');
    return page;
  };

  if (manifest.background.scripts) {
    const backgroundPageTarget = await browser.waitForTarget((target) => target.type() === 'background_page');
    const page = await backgroundPageTarget.page();
    const popup = await openPopup(page);
    return {
      type: 'page',
      target: page,
      browser,
      popup,
    };
  }

  if (manifest.background.service_worker) {
    const workerTarget = await browser.waitForTarget(
      // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
      (target) => target.type() === 'service_worker' && target.url().endsWith('background.js'),
    );
    const worker = await workerTarget.worker();
    const popup = await openPopup(worker);
    return {
      type: 'worker',
      target: worker,
      browser,
      popup,
    };
  }

  // await browser.close();
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

export async function addRule(popup, rule) {
  const action = {
    method: 'save_rule',
    rule,
  };
  const resp = await popup.evaluate('chrome.runtime.sendMessage(' + JSON.stringify(action) + ')');
  // console.log('addRule', resp.id);
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

  return () =>
    popup.evaluate(
      'chrome.runtime.sendMessage(' +
        JSON.stringify({
          method: 'del_rule',
          id: resp.id,
          type: tabName,
        }) +
        ')',
    );
}


export async function getPageValue(browser, url) {
  const page = await browser.newPage();
  await page.goto(`${testServer}${url}`);
  await page.waitForSelector('#value');
  await sleep(500);
  const value = await page.$eval('#value', (el) => el.value);
  await page.close();
  return value;
}

export async function getHeader(browser) {
  const value = await getPageValue(browser, 'get-header.php');
  return JSON.parse(value);
}

export async function getResponseHeader(browser, defaultHeader) {
  const page = await browser.newPage();
  const u = new URLSearchParams(defaultHeader);
  return new Promise((resolve) => {
    page
      .waitForResponse((resp) => resp.url().includes('mock-response.php'))
      .then((resp) => {
        resolve(resp.headers());
      });
    page.goto(`${testServer}mock-response.php?${u.toString()}`);
  });
}