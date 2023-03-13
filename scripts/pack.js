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
  amo: require('./pack-utils/amo'),
  cws: require('./pack-utils/cws'),
  crx: require('./pack-utils/crx'),
};

const { extension } = config;
let platform = null;
for (const it of process.argv) {
  if (it.startsWith('--platform=')) {
    platform = it.substr(11);
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
  const wantKey = `__${name}__`;
  try {
    const content = await fse.readJSON(manifest);
    Object.keys(content).forEach((it) => {
      if (it.startsWith('__')) {
        if (it.startsWith(wantKey)) {
          content[it.substr(wantKey.length)] = content[it];
        }
        delete content[it];
      } else if (typeof (content[it]) === 'object' && !Array.isArray(content[it])) {
        removeManifestKeys(content[it]);
      }
    });
    await fse.outputJSON(manifest, content);
  } catch (e) {
    console.log(e);
  }
}

async function packOnePlatform(name) {
  if (typeof packUtils[name] === 'undefined') {
    console.error(`${name.toUpperCase()} not found`);
    return;
  }
  const thisPack = config.resolve(config.path.pack, name);
  const zipPath = config.resolve(config.path.pack, `${name}.zip`);
  try {
    // 复制一份到dist下面
    await exec(`cp -r ${config.path.dist} ${thisPack}`);
    // 移除掉manifest中的非本平台key
    await removeManifestKeys(path.resolve(thisPack, 'manifest.json'));
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
  if (fs.existsSync(config.path.pack)) {
    await exec(`cd ${config.path.root} && rm -rf ./dist-pack`);
  }
  await fse.mkdir(config.path.pack);
  await fse.mkdir(config.path.release);

  if (!platform) {
    const queue = [];
    Object.keys(extension.autobuild).forEach((it) => {
      if (extension.autobuild[it]) {
        queue.push(packOnePlatform(it));
      } else {
        console.log(`Skip ${it.toUpperCase()}`);
      }
    });
    return;
  }

  if (typeof packUtils[platform] !== 'undefined') {
    packOnePlatform(it);
    return;
  }
  console.log(`${platform} not found`);
}

main();
