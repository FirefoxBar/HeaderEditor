import axios from 'axios';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const token = process.env.TOKEN;
  if (!token) {
    return;
  }

  const pkgJson = await readFile(join(__dirname, '../package.json'), {
    encoding: 'utf8',
  });

  const { version } = JSON.parse(pkgJson);

  // Get latest release version
  // const gitHubToken = process.env.GITHUB_TOKEN;
  // const gitHubBaseURL = process.env.GITHUB_API_URL + '/repos/' + process.env.GITHUB_REPOSITORY;
  // const latestRelease = await axios.get(gitHubBaseURL + '/releases/latest', {
  //   headers: {
  //     'Accept': 'application/vnd.github+json',
  //     'Authorization': 'Bearer ' + gitHubToken,
  //     'X-GitHub-Api-Version': '2022-11-28',
  //   }
  // });
  // const versionPrefix = latestRelease.data.tag_name.replace(/^v/, '');

  // Get remote version
  const params = new URLSearchParams();
  params.append('name', 'header-editor');
  params.append('ver', version);
  params.append('token', token);

  const resp = await axios.get('https://server-api.sylibs.com/ext/snapshot.php?' + params.toString());
  const text = resp.data;

  const filePath = join(__dirname, '../temp/version.txt');
  if (/^(\d+)$/.test(text)) {
    await mkdir(join(__dirname, '../temp/'), {
      recursive: true,
    });
    const newVersion = `${versionPrefix}.${text}`;
    await writeFile(filePath, newVersion, {
      encoding: 'utf8',
    });
    console.log(`Got version: ${newVersion}, wrote to: ${filePath}`);
  } else {
    console.log(`Invalid version: ${text}`);
  }
}

main();