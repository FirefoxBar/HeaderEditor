import browser, { type Runtime } from 'webextension-polyfill';
import { APIs } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { getLocal, getSingle } from '@/share/core/storage';
import Api from '@/share/pages/api';
import { createDriveComponent, type FileItem } from './base-drive';

const clientId = 'd742c0ec-f3ba-4ce9-949a-56507e86ca98';
const scope = [
  'openid',
  'offline_access',
  'files.readwrite',
  'files.readwrite.appfolder',
];
const apiPrefix = 'https://graph.microsoft.com/v1.0/me/';

const getLoginUrl = () => {
  const search = new URLSearchParams();
  search.append('client_id', clientId);
  search.append('response_type', 'code');
  search.append(
    'redirect_uri',
    'https://login.microsoftonline.com/common/oauth2/nativeclient',
  );
  search.append('response_mode', 'query');
  search.append('scope', scope.join(' '));
  search.append('state', 'header-editor');
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${search.toString()}`;
};

interface OneDriveAuth {
  expires_at: number;
  refresh_token: string;
}

const fetchToken = async (params: any) => {
  const newAuth = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        scope: scope.join(' '),
        ...params,
        redirect_uri:
          'https://login.microsoftonline.com/common/oauth2/nativeclient',
      }),
    },
  );
  const data = await newAuth.json();
  if (!data) {
    return null;
  }
  const authInfo = {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await getLocal().set({
    drive_onedrive: authInfo,
  });
  return authInfo;
};

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
  const authInfo = await getSingle<OneDriveAuth>(storage, 'drive_onedrive');
  if (!authInfo) {
    return null;
  }
  if (authInfo.expires_at <= Date.now()) {
    return fetchToken({
      refresh_token: authInfo.refresh_token,
      grant_type: 'refresh_token',
    });
  }
  return authInfo;
};

const handleLogin = async (code: string) => {
  await fetchToken({ code, grant_type: 'authorization_code' });
  // check folder
  const result = await callApi('drive/special/approot/header-editor');
  if (result.error) {
    try {
      const info = await callApi('drive/special/approot');
      await callApi(
        `drive/items/${info.id}/children`,
        JSON.stringify({
          name: 'header-editor',
          folder: {},
        }),
        'POST',
      );
    } catch (error) {
      console.error(error);
    }
  }
};

const OneDrive = createDriveComponent({
  name: 'OneDrive',
  key: 'onedrive',
  onMounted: () => {
    const handler: Runtime.OnMessageListenerNoResponse = (
      request: any,
      sender,
    ) => {
      if (
        request.method === APIs.ON_DRIVE_LOGIN &&
        request.type === 'onedrive'
      ) {
        const code = request.code;
        if (sender.tab?.id) {
          browser.tabs.remove(sender.tab.id);
        }
        emitter.emit(emitter.INNER_DRIVE_LOADING, 'onedrive');
        handleLogin(code).finally(() =>
          emitter.emit(emitter.INNER_DRIVE_READY, 'onedrive'),
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
    await storage.remove('drive_onedrive');
  },
  listFiles: async () => {
    const result = await callApi(
      'drive/special/approot:/header-editor:/children',
    );
    return result.value
      .filter((x: any) => !x.folder)
      .map(
        (x: any) =>
          ({
            name: x.name,
            size: x.size,
            key: x.name,
            time: new Date(x.lastModifiedDateTime).getTime(),
          }) as FileItem,
      );
  },
  downloadFile: (file: FileItem) =>
    callApi(
      `drive/special/approot:/header-editor/${file.key}:/content`,
      undefined,
      'GET',
      'text',
    ),
  deleteFile: (file: FileItem) =>
    callApi(
      `drive/special/approot:/header-editor/${file.key}:/`,
      '',
      'DELETE',
      'text',
    ),
  writeFile: (fileName: string, content: string) =>
    callApi(
      `drive/special/approot:/header-editor/${fileName}:/content`,
      content,
      'PUT',
    ),
});

export default OneDrive;
