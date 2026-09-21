import { Form } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { WebDAVClient } from 'webdav/web';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import emitter from '@/share/core/emitter';
import { getLocal, getSingle } from '@/share/core/storage';
import { Toast } from '@/share/pages/toast';
import { createDriveComponent, type FileItem } from './base-drive';

interface WebDAVAuth {
  url: string;
  username: string;
  password: string;
  path: string;
}

const getAuth = async () => {
  const storage = getLocal();
  const authInfo = await getSingle<WebDAVAuth>(storage, 'drive_webdav');
  if (!authInfo) {
    return null;
  }
  return authInfo;
};

let _auth: string;
let _client: WebDAVClient;
const getWebDAVClient = async (
  authProvider?: () => WebDAVAuth,
): Promise<[WebDAVAuth, WebDAVClient]> => {
  const auth = authProvider ? authProvider() : await getAuth();
  if (!auth) {
    throw new Error('WebDAV auth not found');
  }
  if (_client && _auth === JSON.stringify(auth)) {
    return [auth, _client];
  }
  const c = await import(/* webpackChunkName: 'webdav' */ 'webdav/web');
  _client = c.createClient(auth.url, {
    username: auth.username,
    password: auth.password,
  });
  _auth = JSON.stringify(auth);
  return [auth, _client];
};

const WebDAV = createDriveComponent({
  name: 'WebDAV',
  key: 'webdav',
  checkAuth: async () => {
    const auth = await getAuth();
    if (!auth) {
      return false;
    }
    const [_, client] = await getWebDAVClient();
    await client.getQuota({ path: auth.path });
    return true;
  },
  startLogin: () => {
    let formApi: FormApi;
    Modal.confirm({
      title: 'WebDAV',
      icon: null,
      content: (
        <Form getFormApi={a => (formApi = a)}>
          <Form.Input field="url" label={t('match_url')} />
          <Form.Input field="username" label={t('username')} />
          <Form.Input field="password" label={t('password')} />
          <Form.Input field="path" label={t('path')} defaultValue="/" />
        </Form>
      ),
      onOk: async () => {
        const values = await formApi.validate();
        const [_, client] = await getWebDAVClient(() => values as WebDAVAuth);
        try {
          await client.getQuota({ path: values.path });
        } catch (error) {
          Toast().error((error as Error).message);
          throw error;
        }
        getLocal().set({
          drive_webdav: values as WebDAVAuth,
        });
        emitter.emit(emitter.INNER_DRIVE_READY, 'webdav');
      },
    });
  },
  logout: () => getLocal().remove('drive_webdav'),
  listFiles: async () => {
    const [auth, client] = await getWebDAVClient();
    const result = await client.getDirectoryContents(auth.path);
    console.log(result);
    return result
      .filter(x => x.type === 'file')
      .map(
        x =>
          ({
            name: x.basename,
            size: x.size,
            key: x.filename,
            time: new Date(x.lastmod).getTime(),
          }) as FileItem,
      );
  },
  downloadFile: async (file: FileItem) => {
    const [_, client] = await getWebDAVClient();
    const content = await client.getFileContents(file.key, { format: 'text' });
    return content as string;
  },
  deleteFile: async (file: FileItem) => {
    const [_, client] = await getWebDAVClient();
    await client.deleteFile(file.key);
  },
  writeFile: async (fileName: string, content: string) => {
    const [auth, client] = await getWebDAVClient();
    const prefix = auth.path.endsWith('/') ? auth.path : `${auth.path}/`;
    await client.putFileContents(prefix + fileName, content);
  },
});

export default WebDAV;
