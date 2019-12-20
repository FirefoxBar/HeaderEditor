/**
 * 进行多渠道打包
 * 
 * dist：原本的输出文件夹
 * dist-pack：用于打包的文件夹
 * dist-pack/{platform}：各个平台的文件夹
 * dist-pack/{platform}.zip：各个平台的打包文件
 * dist-pack/*：其他平台打包输出结果
 * 在这里，打包文件夹统一命名为pack
 */
const fs = reqiore('fs');
const path = require('path');
const config = require('./extension-config').config;
const processExec = require('child_process').exec;
const packUtils = {
  xpi: require('./pack-utils/xpi'),
  amo: require('./pack-utils/amo'),
  cws: require('./pack-utils/cws'),
  crx: require('./pack-utils/crx')
}

const root = path.resolve(__dirname, "..");
const dist = path.resolve(root, 'dist');
const pack = path.resolve(root, 'dist-pack');
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

// 检查打包目录是否存在
const checkPermission = fs.existsSync(pack) ? exec(`cd ${root} && rm -rf ./dist-pack`) : Promise.resolve();

function removeManifestKeys(manifest, name) {
  const wantKey = '__' + name + '__';
  try {
    const content = JSON.parse(fs.readFileSync(manifest, { encoding: "UTF-8" }));
    Object.keys(content).forEach(it => {
      if (it.startsWith('__')) {
        if (it.startsWith(wantKey)) {
          content[it.substr(wantKey.length)] = content[it];
        }
        delete content[it];
      } else if (typeof (content[it]) === "object" && !Array.isArray(content[it])) {
        removeManifestKeys(content[it]);
      }
    });
    fs.writeFileSync(manifest, JSON.stringify(content));
  } catch (e) {
    console.log(e);
  }
}

function packOnePlatform(name) {
  if (typeof (packUtils[name]) === "undefined") {
    console.error(name.toUpperCase() + ' not found');
    return;
  }
  const thisPack = path.resolve(pack, name);
  const zipPath = path.resolve(pack, name + '.zip');
  // 复制一份到dist下面
  return exec(`cp -r ${dist} ${thisPack}`)
    // 移除掉manifest中的非本平台key
    .then(() => removeManifestKeys(path.resolve(thisPack, 'manifest.json')))
    // 打包成zip
    .then(() => exec(`cd ${thisPack} && zip -r ${zipPath} ./*`))
    // 执行上传等操作
    .then(() => packUtils[it](zipPath, pack))
    .then(res => console.log(`${name}: ${res}`))
    .then(() => fs.unlinkSync(zipPath))
    .catch(console.error);
}

checkPermission()
  .then(() => {
    if (!platform) {
      const queue = [];
      Object.keys(config.autobuild).forEach(it => {
        if (config.autobuild[it]) {
          queue.push(packOnePlatform(it));
        } else {
          console.log('Skip ' + it.toUpperCase());
        }
      });
    } else {
      if (typeof (packUtils[platform]) !== "undefined") {
        packOnePlatform(it);
      } else {
        console.log(platform + ' not found');
      }
    }
  })