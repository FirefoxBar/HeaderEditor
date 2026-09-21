import browser, { type Runtime } from 'webextension-polyfill';
import { APIs } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { getLocal, getSingle } from '@/share/core/storage';
import Api from '@/share/pages/api';
import { createDriveComponent, type FileItem } from './base-drive';

const clientId =
  '1093144396733-22kuva2susjn585850ka8euhf61n41ij.apps.googleusercontent.com';
const scope = 'https://www.googleapis.com/auth/drive.appdata';
const apiPrefix = 'https://www.googleapis.com/';

const getLoginUrl = () => {
  const search = new URLSearchParams();
  search.append('scope', scope);
  search.append('include_granted_scopes', 'true');
  search.append('state', 'header-editor');
  search.append(
    'redirect_uri',
    'https://ext.firefoxcn.net/login/callback/google.html',
  );
  search.append('response_type', 'token');
  search.append('client_id', clientId);
  return `https://accounts.google.com/o/oauth2/v2/auth?${search.toString()}`;
};

interface GoogleDriveAuth {
  access_token: string;
  expires_at: number;
}

const callApi = async (
  path: string,
  data: any = undefined,
  method = 'GET',
  type = 'json',
) => {
  const auth = await getAuth();
  if (!auth) {
    return null;
  }
  const res = await fetch(apiPrefix + path, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.access_token}`,
    },
    body: data,
  });
  const d = await (type === 'json' ? res.json() : res.text());
  if (!d) {
    return null;
  }
  return d;
};

const getAuth = async () => {
  const storage = getLocal();
  const authInfo = await getSingle<GoogleDriveAuth>(storage, 'drive_google');
  if (!authInfo) {
    return null;
  }
  console.log('authInfo', authInfo, Date.now());
  if (authInfo.expires_at <= Date.now()) {
    await storage.remove('drive_google');
    return null;
  }
  return authInfo;
};

const handleLogin = async (access_token: string) => {
  const res = await fetch(
    `${apiPrefix}oauth2/v3/tokeninfo?access_token=${access_token}`,
  );
  const data = await res.json();
  if (!data) {
    return null;
  }
  const authInfo = {
    ...data,
    access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 1,
  };
  await getLocal().set({
    drive_google: authInfo,
  });
  return authInfo;
};

const GoogleDrive = createDriveComponent({
  name: 'GoogleDrive',
  key: 'google-drive',
  onMounted: () => {
    const handler: Runtime.OnMessageListenerNoResponse = (
      request: any,
      sender,
    ) => {
      if (
        request.method === APIs.ON_DRIVE_LOGIN &&
        request.type === 'google-drive'
      ) {
        const accessToken = request.accessToken;
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
        emitter.emit(emitter.INNER_DRIVE_LOADING, 'google-drive');
        handleLogin(accessToken).finally(() =>
          emitter.emit(emitter.INNER_DRIVE_READY, 'google-drive'),
        );
      }
    };
    browser.runtime.onMessage.addListener(handler);
    return () => {
      browser.runtime.onMessage.removeListener(handler);
    };
  },
  checkAuth: async () => {
    const auth = await getAuth();
    return auth !== null;
  },
  startLogin: () => {
    Api.openURL(getLoginUrl());
  },
  logout: async () => {
    const storage = getLocal();
    await storage.remove('drive_google');
  },
  listFiles: async () => {
    const result = await callApi(
      `drive/v3/files?spaces=appDataFolder&orderBy=quotaBytesUsed&q=${encodeURIComponent(
        "name contains 'HE_'",
      )}&fields=${encodeURIComponent('files(id, size, name, modifiedTime)')}`,
    );
    return result.files.map(
      (x: any) =>
        ({
          name: x.name.replace(/^HE_/, ''),
          size: x.size,
          key: x.id,
          time: new Date(x.modifiedTime).getTime(),
        }) as FileItem,
    );
  },
  downloadFile: (file: FileItem) =>
    callApi(
      `drive/v3/files/${file.key}?spaces=appDataFolder&alt=media`,
      undefined,
      'GET',
      'text',
    ),
  deleteFile: (file: FileItem) =>
    callApi(`drive/v3/files/${file.key}`, undefined, 'DELETE', 'text'),
  writeFile: async (fileName: string, content: string) => {
    const auth = await getAuth();
    if (!auth) {
      return;
    }
    const boundary = 'BOUNDARY';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const requestBody = new Blob([
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify({ name: `HE_${fileName}`, parents: ['appDataFolder'] }),
      delimiter,
      `Content-Type: application/octet-stream\r\n\r\n`,
      content,
      closeDelimiter,
    ]);
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: requestBody,
      },
    );
    return response.json();
  },
});

export default GoogleDrive;
