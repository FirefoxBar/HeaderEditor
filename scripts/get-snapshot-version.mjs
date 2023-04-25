import fetch from 'node-fetch';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const token = process.env.TOKEN;

  if (!token) {
    return;
  }

  // Get latest release version
  const gitHubToken = process.env.GITHUB_TOKEN;
  const gitHubBaseURL = process.env.GITHUB_API_URL + '/repos/' + process.env.GITHUB_REPOSITORY;
  const latestReleaseResp = await fetch(gitHubBaseURL + '/releases/latest', {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + gitHubToken,
      'X-GitHub-Api-Version': '2022-11-28',
    }
  });
  const latestRelease = await latestReleaseResp.json();
  const versionPrefix = latestRelease.tag_name.replace(/^v/, '');

  // Get remote version
  const params = new URLSearchParams();
  params.append('name', 'header-editor');
  params.append('ver', versionPrefix);
  params.append('token', token);

  const resp = await fetch('https://ext.firefoxcn.net/api/snapshot.php?' + params.toString());
  const text = await resp.text();

  const filePath = join(__dirname, '../temp/version.txt');
  if (/^(\d+)$/.test(text)) {
    await mkdir(join(__dirname, '../temp/'), {
      recursive: true,
    });
    await writeFile(filePath, versionPrefix + '.' + text, {
      encoding: 'utf8',
    });
  }

  console.log('Got version: ' + text + ', wrote to: ' + filePath);
}

main();