import { getLocal, getSingle } from '@/share/core/storage';
import Api from '@/share/pages/api';
import { createDriveComponent, type FileItem } from './base-drive';

const clientId = '5e2610db11c448378cb5028f647a17a0';
const apiPrefix = 'https://cloud-api.yandex.net/v1/disk/';
const pathPrefix = 'app:/header-editor';

interface YandexAuth {
  access_token: string;
  expires_at: number;
}

const callApi = async (
  path: string,
  data: any = undefined,
  method = 'GET',
  responseType = 'json',
) => {
  const auth = await getAuth();
  if (!auth) {
    return null;
  }
  const res = await fetch(apiPrefix + path, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `OAuth ${auth.access_token}`,
    },
    body: data,
  });
  if (responseType === 'status') {
    return res.status;
  }
  const d = await (responseType === 'json' ? res.json() : res.text());
  if (!d) {
    return null;
  }
  return d;
};

const getAuth = async () => {
  const storage = getLocal();
  const authInfo = await getSingle<YandexAuth>(storage, 'drive_yandex');
  if (!authInfo) {
    return null;
  }
  if (authInfo.expires_at <= Date.now()) {
    await storage.remove('drive_yandex');
    return null;
  }
  return authInfo;
};

const handleLogin = async (access_token: string, expiresIn: number) => {
  const res = await fetch(`${apiPrefix}resources?path=${pathPrefix}`, {
    headers: {
      Authorization: `OAuth ${access_token}`,
    },
  });
  const statusCode = res.status;
  if (statusCode > 400 && statusCode !== 404) {
    return null;
  }
  const authInfo = {
    access_token,
    expires_at: Date.now() + expiresIn * 1000 - 1,
  };
  await getLocal().set({
    drive_yandex: authInfo,
  });
  if (statusCode === 404) {
    await callApi(`resources?path=${pathPrefix}`, '', 'PUT');
  }
  return authInfo;
};

const Yandex = createDriveComponent({
  name: 'Yandex',
  key: 'yandex',
  handleLoginMessage: async (request: any) => {
    const accessToken = request.accessToken;
    const expiresIn = request.expireIn;
    await handleLogin(accessToken, expiresIn);
  },
  checkAuth: async () => {
    const auth = await getAuth();
    return auth !== null;
  },
  startLogin: () => {
    Api.openURL(
      `https://oauth.yandex.com/authorize?response_type=token&state=header-editor&client_id=${clientId}`,
    );
  },
  logout: () => getLocal().remove('drive_yandex'),
  listFiles: async () => {
    const result = await callApi(`resources?path=${pathPrefix}`);
    return result._embedded.items.map(
      (x: any) =>
        ({
          name: x.name,
          size: x.size,
          key: x.name,
          time: new Date(x.modified).getTime(),
        }) as FileItem,
    );
  },
  downloadFile: async (file: FileItem) => {
    const res = await callApi(
      `resources/download?path=${pathPrefix}/${file.key}`,
    );
    const { href, method } = res;
    const req = await fetch(href, {
      method,
    });
    return await req.text();
  },
  deleteFile: async (file: FileItem) => {
    const res = await callApi(
      `resources?path=${pathPrefix}/${file.key}`,
      undefined,
      'DELETE',
      'status',
    );
    if (res !== 204) {
      throw new Error(`Delete file failed, status: ${res}`);
    }
  },
  writeFile: async (fileName: string, content: string) => {
    const res = await callApi(
      `resources/upload?path=${pathPrefix}/${fileName}`,
    );
    const { href, method } = res;
    const writeReq = await fetch(href, {
      method,
      body: content,
    });
    if (writeReq.status !== 201) {
      throw new Error(`Write file failed, status: ${writeReq.status}`);
    }
  },
});

export default Yandex;
