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
import { unlink, mkdir } from 'fs/promises';
import { readJSON, outputJSON } from 'fs-extra/esm';
import { join } from 'path';
import { extension, resolve as _resolve, path as _path } from './config.mjs';
import { exec as processExec } from 'child_process';
import packUtils from './pack-utils/index.mjs';

let platform = null;
for (const it of process.argv) {
  if (it.startsWith('--platform=')) {
    platform = it.substr(11);
    if (platform.indexOf(',') > 0) {
      platform = platform.trim().split(',');
    }
    break;
  }
}

function exec(commands) {
  return new Promise((resolve, reject) => {
    processExec(commands, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function removeManifestKeys(manifest, name) {
  console.log('start convert manifest(' + manifest + ') for ' + name);
  const wantKey = `__${name}__`;
  
  const removeObjKeys = obj => {
    Object.keys(obj).forEach((it) => {
      if (it.startsWith('__')) {
        if (it.startsWith(wantKey)) {
          const finalKey = it.substr(wantKey.length);
          console.log('copy key ' + finalKey + ' from ' + it);
          obj[finalKey] = obj[it];
        }
        console.log('remove key ' + it);
        delete obj[it];
      } else if (typeof obj[it] === 'object' && !Array.isArray(obj[it])) {
        removeObjKeys(obj[it]);
      }
    });
  }

  try {
    const content = await readJSON(manifest);
    removeObjKeys(content);
    await outputJSON(manifest, content);
  } catch (e) {
    console.log(e);
  }
}

async function packOnePlatform(name) {
  if (typeof packUtils[name] === 'undefined') {
    console.error(`pack-utils for ${name} not found`);
    return;
  }
  const thisPack = _resolve(_path.pack, name);
  const zipPath = _resolve(_path.pack, `${name}.zip`);
  try {
    // 复制一份到dist下面
    await exec(`cp -r ${_path.dist} ${thisPack}`);
    // 移除掉manifest中的非本平台key
    await removeManifestKeys(join(thisPack, 'manifest.json'), name);
    // 打包成zip
    await exec(`cd ${thisPack} && zip -r ${zipPath} ./*`);
    // 执行上传等操作
    const res = await packUtils[name](zipPath, _path.release);
    console.log(`${name}: ${res}`);
    await unlink(zipPath);
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  // 检查打包目录是否存在
  await exec(`cd ${_path.root} && rm -rf ./temp/dist-pack`);
  await exec(`cd ${_path.root} && rm -rf ./temp/release`);
  await mkdir(_path.pack, {
    recursive: true,
  });
  await mkdir(_path.release, {
    recursive: true,
  });

  if (platform) {
    if (Array.isArray(platform)) {
      platform.forEach((it) => {
        if (typeof packUtils[it] !== 'undefined') {
          packOnePlatform(it);
        } else {
          console.log(`${it} not found`);
        }
      });
      return;
    }
      
    if (typeof packUtils[platform] !== 'undefined') {
      packOnePlatform(platform);
      return;
    }
    console.log(`${platform} not found`);

    return;
  }
  
  const queue = [];
  Object.keys(extension.autobuild).forEach((it) => {
    if (extension.autobuild[it]) {
      queue.push(packOnePlatform(it));
    } else {
      console.log(`Skip ${it.toUpperCase()}`);
    }
  });
}

main();
