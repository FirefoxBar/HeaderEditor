const fs = require('fs');
const fetch = require('node-fetch');
const config = require('../config');

const webStoreId = config.extension.chrome.store.id;
const webStoreToken = process.env[config.extension.chrome.store.token];
const webStoreSecret = process.env[config.extension.chrome.store.secret];

let _webStoreToken = null;
async function getToken() {
  if (_webStoreToken) {
    return _webStoreToken;
  }
  const resp = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: webStoreId,
      client_secret: webStoreSecret,
      refresh_token: webStoreToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const res = await resp.json();
  if (res.access_token) {
    _webStoreToken = res.access_token;
    return _webStoreToken;
  } else {
    throw new Error(res.error);
  }
}

async function upload(readStream, token) {
  const res = await fetch(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${config.extension.chrome.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
    body: readStream,
  });

  return res.json();
}

async function publish(target = 'default', token) {
  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${config.extension.chrome.id}/publish?publishTarget=${target}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
  });

  return res.json();
}

async function packCws(zipPath) {
  const distStream = fs.createReadStream(zipPath);
  const token = await getToken();
  await upload(distStream, token);
  return publish('default', token);
}

module.exports = packCws;
