const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function main() {
  const token = process.env.TOKEN;

  if (!token) {
    return;
  }

  // read version from package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), {
    encoding: 'utf-8',
  }));

  const params = new URLSearchParams();
  params.append('name', 'header-editor');
  params.append('ver', pkg.version);
  params.append('token', token);

  const resp = await fetch('https://ext.firefoxcn.net/snapshot.php?' + params.toString());
  const text = await resp.text();

  const filePath = path.join(__dirname, '../temp/snapshot-version.txt');
  if (/^(\d+)$/.test(text)) {
    fs.mkdirSync(path.join(__dirname, '../temp/'), {
      recursive: true,
    });
    fs.writeFileSync(filePath, text, {
      encoding: 'utf8',
    });
  }

  console.log('Got version: ' + text + ', wrote to: ' + filePath);
}

main();