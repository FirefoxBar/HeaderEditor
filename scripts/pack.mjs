/**
 * 进行多渠道打包
 *
 * dist：原本的输出文件夹
 * dist-pack：用于打包的文件夹
 * dist-pack/{platform}：各个平台的文件夹
 * dist-pack/{platform}.zip：各个平台的打包文件
 * dist-pack/release：其他平台打包输出结果
 * 在这里，打包文件夹统一命名为pack
 */

import cpr from 'cpr';
import { mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { rimraf } from 'rimraf';
import getManifest from './browser-config/get-manifest.js';
import {
  join as _join,
  path as _path,
  extension,
  getDistPath,
  getVersion,
  scriptRoot,
} from './config.mjs';
import amo from './pack-utils/amo.mjs';
import crx from './pack-utils/crx.mjs';
import cws from './pack-utils/cws.mjs';
import edge from './pack-utils/edge.mjs';
import xpi from './pack-utils/xpi.mjs';
import { outputJSON, readJSON } from './utils.mjs';
import { createZip } from './zip.mjs';

const packUtils = {
  amo,
  cws,
  xpi,
  edge,
  crx,
};

function copyDir(source, target) {
  return new Promise((resolve, reject) => {
    cpr(
      source,
      target,
      {
        deleteFirst: true,
        overwrite: true,
        confirm: false,
      },
      (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      },
    );
  });
}

/**
 * 打包一个平台的产物
 * @param {*} name
 * @param {*} browserConfig 对应browser.config.json中的配置
 * @param {*} extensionConfig 对应extension.json中的配置
 * @returns
 */
async function packOnePlatform(name, browserConfig, extensionConfig) {
  if (typeof packUtils[name] === 'undefined') {
    console.error(`pack-utils for ${name} not found`);
    return;
  }
  const dirName = [name, extensionConfig.browser].join('_');
  const thisPack = _join(_path.pack, dirName);
  const zipPath = _join(_path.pack, `${dirName}.zip`);
  try {
    // 复制一份到dist下面
    await copyDir(getDistPath(extensionConfig.browser), thisPack);
    // 重新生成manifest
    const version = await getVersion(thisPack);
    await outputJSON(
      _join(thisPack, 'manifest.json'),
      getManifest(extensionConfig.browser, {
        dev: false,
        version,
        amo: name === 'amo',
        xpi: name === 'xpi',
      }),
    );
    // 打包成zip
    console.log(`zip ${thisPack} -> ${zipPath}`);
    await createZip(thisPack, zipPath);
    // 执行上传等操作
    console.log(`running ${name} pack...`);
    const res = await packUtils[name](
      thisPack,
      zipPath,
      _path.release,
      browserConfig,
      extensionConfig,
    );
    console.log(`${name}: ${res}`);
    await unlink(zipPath);
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  // 检查打包目录是否存在
  await rimraf(_path.pack);
  await rimraf(_path.release);
  await mkdir(_path.pack, {
    recursive: true,
  });
  await mkdir(_path.release, {
    recursive: true,
  });

  let platform = [];
  if (process.env.PACK_PLATFORM) {
    platform = process.env.PACK_PLATFORM.split(',');
  } else if (process.env.INPUT_PLATFORM) {
    platform = process.env.INPUT_PLATFORM.split(',');
  } else {
    platform = Object.keys(extension.auto).filter(x =>
      Boolean(extension.auto[x]),
    );
  }

  const browserConfig = await readJSON(
    join(scriptRoot, 'browser-config/browser.config.json'),
  );

  const queue = [];

  for (const name of platform) {
    const platformConfig = extension[name];
    for (const item of platformConfig) {
      const browser = browserConfig[item.browser];
      queue.push(packOnePlatform(name, browser, item));
    }
  }

  await Promise.all(queue);
}

main();
