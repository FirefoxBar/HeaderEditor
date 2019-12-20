const fs = require('fs');
const fetch = require('node-fetch');
const exec = require('child_process').exec;
const common = require('../extension-config');
const webStoreId = common.config.chrome.store.id;
const webStoreToken = process.env[common.config.chrome.store.token];
const webStoreSecret = process.env[common.config.chrome.store.secret];

let _webStoreToken = null;
function getToken() {
  if (_webStoreToken) {
    return Promise.resolve(_webStoreToken);
  }
  return new Promise((resolve, reject) => {
    fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: "POST",
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: webStoreId,
        client_secret: webStoreSecret,
        refresh_token: webStoreToken,
        grant_type: 'refresh_token'
      }).toString()
    })
      .then(res => res.json())
      .then(res => {
        if (res.access_token) {
          _webStoreToken = res.access_token;
          resolve(_webStoreToken);
        } else {
          reject(res.error);
        }
      })
      .catch(reject);
  });
}

function upload(readStream, token) {
  return fetch('https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + common.config.chrome.id, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2'
    },
    body: readStream
  })
    .then(res => res.json());
}

function publish(target = 'default', token) {
  const url = 'https://www.googleapis.com/chromewebstore/v1.1/items/' + common.config.chrome.id + '/publish?publishTarget=' + target;
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2'
    }
  })
    .then(res => res.json());
}

module.exports = function (zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    const distStream = fs.createReadStream(zipPath);
    getToken().then(token => {
      upload(distStream, token)
        .then(() => publish("default", token))
        .then(resolve)
        .catch(reject);
    })
      .catch(reject);
  })
};