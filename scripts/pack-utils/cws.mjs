import axios from 'axios';
import { Blob } from 'buffer';
import { readFile } from 'fs/promises';

const webStoreId = process.env.CWS_CLIENT_ID;
const webStoreToken = process.env.CWS_TOKEN;
const webStoreSecret = process.env.CWS_CLIENT_SECRET;

let _webStoreToken = null;
async function getToken() {
  if (_webStoreToken) {
    return _webStoreToken;
  }
  const post = new URLSearchParams({
    client_id: webStoreId,
    client_secret: webStoreSecret,
    refresh_token: webStoreToken,
    grant_type: 'refresh_token',
  });
  const resp = await axios.post(
    'https://www.googleapis.com/oauth2/v4/token',
    post.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );
  const res = resp.data;
  if (res.access_token) {
    _webStoreToken = res.access_token;
    return _webStoreToken;
  } else {
    throw new Error(res.error);
  }
}

async function upload(id, content, token) {
  const blob = new Blob(content);
  const res = await axios.put(
    `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${id}`,
    blob,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-goog-api-version': '2',
      },
    },
  );

  return res.data;
}

async function publish(id, target = 'default', token) {
  const url = `https://www.googleapis.com/chromewebstore/v1.1/items/${id}/publish?publishTarget=${target}`;
  const res = await axios.post(url, '', {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
  });

  return res.data;
}

async function packCws(
  sourcePath,
  zipPath,
  releasePath,
  browserConfig,
  extensionConfig,
) {
  if (!process.env.CWS_CLIENT_ID) {
    return Promise.reject(new Error('CWS_CLIENT_ID not found'));
  }
  if (!process.env.CWS_CLIENT_SECRET) {
    return Promise.reject(new Error('CWS_CLIENT_SECRET not found'));
  }
  if (!process.env.CWS_TOKEN) {
    return Promise.reject(new Error('CWS_TOKEN not found'));
  }

  const distContent = await readFile(zipPath);
  const token = await getToken();
  const id = extensionConfig.id;
  await upload(id, distContent, token);
  return publish(id, 'default', token);
}

export default packCws;
