import { Form } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import Modal from '@/share/components/modal';
import SemiLocale from '@/share/components/semi-locale';
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

interface WebDAVItem {
  key: string;
  name: string;
  size: number;
  time: number;
  isCollection: boolean;
}

const PROPFIND_BODY = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<d:propfind xmlns:d="DAV:">',
  '<d:prop>',
  '<d:resourcetype/>',
  '<d:getcontentlength/>',
  '<d:getlastmodified/>',
  '</d:prop>',
  '</d:propfind>',
].join('');

const getAuth = async () => {
  const storage = getLocal();
  const authInfo = await getSingle<WebDAVAuth>(storage, 'drive_webdav');
  if (!authInfo) {
    return null;
  }
  return authInfo;
};

const getAuthHeader = (auth: WebDAVAuth) => {
  const raw = new TextEncoder().encode(`${auth.username}:${auth.password}`);
  let binary = '';
  for (const byte of raw) {
    binary += String.fromCharCode(byte);
  }
  return `Basic ${btoa(binary)}`;
};

/** Endpoint base pathname without trailing slashes, e.g. `/dav/files/user` */
const getBasePath = (url: string) => {
  const pathname = new URL(url).pathname;
  return pathname.replace(/\/+$/, '');
};

/** Build the request URL by joining `path` (relative to the endpoint) onto `auth.url` */
const buildUrl = (auth: WebDAVAuth, path: string) => {
  const url = new URL(auth.url);
  const segments = (path.startsWith('/') ? path : `/${path}`).split('/');
  const encoded = segments
    .map(segment => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');
  url.pathname = `${getBasePath(auth.url)}${encoded}`;
  return url.toString();
};

/** Normalize a `href` from the server into a key relative to the endpoint */
const toKey = (auth: WebDAVAuth, href: string) => {
  const pathname = new URL(href, auth.url).pathname;
  const basePath = getBasePath(auth.url);
  const relative =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length)
      : pathname;
  try {
    return decodeURIComponent(relative || '/');
  } catch {
    return relative || '/';
  }
};

const callApi = async (
  auth: WebDAVAuth,
  path: string,
  method = 'GET',
  body?: string,
  headers: Record<string, string> = {},
): Promise<string> => {
  const res = await fetch(buildUrl(auth, path), {
    method,
    headers: {
      Authorization: getAuthHeader(auth),
      ...headers,
    },
    body,
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).trim();
    throw new Error(
      `WebDAV ${method} failed: ${res.status} ${res.statusText}${
        detail ? ` - ${detail}` : ''
      }`,
    );
  }
  return res.text();
};

const parseMultiStatus = (xml: string, auth: WebDAVAuth): WebDAVItem[] => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('WebDAV: invalid multistatus response');
  }
  const responses = Array.from(doc.getElementsByTagNameNS('DAV:', 'response'));
  if (responses.length === 0) {
    throw new Error('WebDAV: no response in multistatus');
  }
  return responses.map(response => {
    const href = response.getElementsByTagNameNS('DAV:', 'href')[0];
    const key = toKey(auth, href?.textContent ?? '/');
    const prop = response.getElementsByTagNameNS('DAV:', 'prop')[0];
    const size = Number(
      prop?.getElementsByTagNameNS('DAV:', 'getcontentlength')[0]
        ?.textContent ?? 0,
    );
    const lastmod =
      prop?.getElementsByTagNameNS('DAV:', 'getlastmodified')[0]?.textContent ??
      '';
    const resourceType = prop?.getElementsByTagNameNS(
      'DAV:',
      'resourcetype',
    )[0];
    const segments = key.split('/');
    return {
      key,
      name: segments[segments.length - 1],
      size: Number.isFinite(size) ? size : 0,
      time: lastmod ? new Date(lastmod).getTime() : 0,
      isCollection: !!resourceType?.getElementsByTagNameNS('DAV:', 'collection')
        .length,
    } as WebDAVItem;
  });
};

/** PROPFIND `path` and return the parsed items */
const propfind = async (
  auth: WebDAVAuth,
  path: string,
  depth: '0' | '1',
): Promise<WebDAVItem[]> => {
  const xml = await callApi(auth, path, 'PROPFIND', PROPFIND_BODY, {
    Depth: depth,
    'Content-Type': 'application/xml; charset=utf-8',
  });
  return parseMultiStatus(xml, auth);
};

const WebDAV = createDriveComponent({
  name: 'WebDAV',
  key: 'webdav',
  checkAuth: async () => {
    const auth = await getAuth();
    if (!auth) {
      return false;
    }
    try {
      await propfind(auth, auth.path, '0');
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  startLogin: () => {
    let formApi: FormApi;
    Modal.confirm({
      title: 'WebDAV',
      icon: null,
      maskClosable: false,
      content: (
        <SemiLocale>
          <Form
            getFormApi={a => (formApi = a)}
            initValues={{ url: 'https://', path: '/' }}
          >
            <Form.Input
              field="url"
              label={t('match_url')}
              placeholder="https://example.com/webdav"
              rules={[{ required: true }, { type: 'url' }]}
            />
            <Form.Input
              field="username"
              label={t('username')}
              rules={[{ required: true }]}
            />
            <Form.Input
              field="password"
              label={t('password')}
              type="password"
              rules={[{ required: true }]}
            />
            <Form.Input
              field="path"
              label={t('path')}
              rules={[{ required: true }]}
            />
          </Form>
        </SemiLocale>
      ),
      onOk: async () => {
        const values = await formApi.validate();
        const auth = values as WebDAVAuth;
        try {
          await propfind(auth, auth.path, '0');
        } catch (error) {
          Toast().error((error as Error).message);
          throw error;
        }
        await getLocal().set({
          drive_webdav: auth,
        });
        emitter.emit(emitter.INNER_DRIVE_READY, 'webdav');
      },
    });
  },
  logout: () => getLocal().remove('drive_webdav'),
  listFiles: async () => {
    const auth = await getAuth();
    if (!auth) {
      return [];
    }
    const result = await propfind(auth, auth.path, '1');
    return result
      .filter(x => !x.isCollection)
      .map(
        x =>
          ({
            name: x.name,
            size: x.size,
            key: x.key,
            time: x.time,
          }) as FileItem,
      );
  },
  downloadFile: async (file: FileItem) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('WebDAV auth not found');
    }
    return callApi(auth, file.key);
  },
  deleteFile: async (file: FileItem) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('WebDAV auth not found');
    }
    await callApi(auth, file.key, 'DELETE');
  },
  writeFile: async (fileName: string, content: string) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('WebDAV auth not found');
    }
    const prefix = auth.path.endsWith('/') ? auth.path : `${auth.path}/`;
    await callApi(auth, prefix + fileName, 'PUT', content, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
  },
});

export default WebDAV;
