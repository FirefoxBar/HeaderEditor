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
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const config = require('./config');
const processExec = require('child_process').exec;

const packUtils = {
  xpi: require('./pack-utils/xpi'),
  // amo: require('./pack-utils/amo'),
  // cws: require('./pack-utils/cws'),
  crx: require('./pack-utils/crx'),
};

const { extension } = config;
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
      } else if (typeof (obj[it]) === 'object' && !Array.isArray(obj[it])) {
        removeObjKeys(obj[it]);
      }
    });
  }

  try {
    const content = await fse.readJSON(manifest);
    removeObjKeys(content);
    await fse.outputJSON(manifest, content);
  } catch (e) {
    console.log(e);
  }
}

async function packOnePlatform(name) {
  if (typeof packUtils[name] === 'undefined') {
    console.error(`pack-utils for ${name} not found`);
    return;
  }
  const thisPack = config.resolve(config.path.pack, name);
  const zipPath = config.resolve(config.path.pack, `${name}.zip`);
  try {
    // 复制一份到dist下面
    await exec(`cp -r ${config.path.dist} ${thisPack}`);
    // 移除掉manifest中的非本平台key
    await removeManifestKeys(path.join(thisPack, 'manifest.json'), name);
    // 打包成zip
    await exec(`cd ${thisPack} && zip -r ${zipPath} ./*`);
    // 执行上传等操作
    const res = await packUtils[name](zipPath, config.path.release);
    console.log(`${name}: ${res}`);
    await fse.unlink(zipPath);
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  // 检查打包目录是否存在
  await exec(`cd ${config.path.root} && rm -rf ./temp/dist-pack`);
  await exec(`cd ${config.path.root} && rm -rf ./temp/release`);
  await fse.mkdir(config.path.pack, {
    recursive: true,
  });
  await fse.mkdir(config.path.release, {
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
