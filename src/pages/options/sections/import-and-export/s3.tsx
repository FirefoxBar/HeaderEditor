import { Form } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import emitter from '@/share/core/emitter';
import { getLocal, getSingle } from '@/share/core/storage';
import { Toast } from '@/share/pages/toast';
import { createDriveComponent, type FileItem } from './base-drive';

interface S3Auth {
  endPoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  path: string;
}

const getAuth = async () => {
  const storage = getLocal();
  const authInfo = await getSingle<S3Auth>(storage, 'drive_s3');
  if (!authInfo) {
    return null;
  }
  return authInfo;
};

/** Load the SDK on demand to keep it out of the main bundle */
const createClient = async (auth: S3Auth) => {
  const { S3Client } = await import('@bradenmacdonald/s3-lite-client');
  return new S3Client({
    endPoint: auth.endPoint,
    region: auth.region,
    bucket: auth.bucket,
    accessKey: auth.accessKey,
    secretKey: auth.secretKey,
  });
};

/** Object key prefix relative to the bucket root, e.g. `header-editor/` */
const getPrefix = (path: string) => {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  return normalized ? `${normalized}/` : '';
};

/** Verify the credentials, bucket and path by listing at most one object */
const verifyConnection = async (auth: S3Auth) => {
  const client = await createClient(auth);
  const iterator = client.listObjects({
    prefix: getPrefix(auth.path),
    maxResults: 1,
  });
  await iterator.next();
};

const S3 = createDriveComponent({
  name: 'S3',
  key: 's3',
  checkAuth: async () => {
    const auth = await getAuth();
    if (!auth) {
      return false;
    }
    try {
      await verifyConnection(auth);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  startLogin: () => {
    let formApi: FormApi;
    Modal.confirm({
      title: 'S3',
      icon: null,
      maskClosable: false,
      content: (
        <Form
          getFormApi={a => (formApi = a)}
          initValues={{ endPoint: 'https://', region: 'us-east-1', path: '/' }}
        >
          <Form.Input
            field="endPoint"
            label="Endpoint"
            placeholder="https://s3.example.com"
            rules={[{ required: true }, { type: 'url' }]}
          />
          <Form.Input
            field="region"
            label="Region"
            rules={[{ required: true }]}
          />
          <Form.Input
            field="bucket"
            label="Bucket"
            rules={[{ required: true }]}
          />
          <Form.Input
            field="accessKey"
            label="Access Key"
            rules={[{ required: true }]}
          />
          <Form.Input
            field="secretKey"
            label="Secret Key"
            type="password"
            rules={[{ required: true }]}
          />
          <Form.Input
            field="path"
            label={t('path')}
            rules={[{ required: true }]}
          />
        </Form>
      ),
      onOk: async () => {
        const values = await formApi.validate();
        const auth = values as S3Auth;
        try {
          await verifyConnection(auth);
        } catch (error) {
          Toast().error((error as Error).message);
          throw error;
        }
        await getLocal().set({
          drive_s3: auth,
        });
        emitter.emit(emitter.INNER_DRIVE_READY, 's3');
      },
    });
  },
  logout: () => getLocal().remove('drive_s3'),
  listFiles: async () => {
    const auth = await getAuth();
    if (!auth) {
      return [];
    }
    const client = await createClient(auth);
    const prefix = getPrefix(auth.path);
    const result: FileItem[] = [];
    for await (const entry of client.listObjectsGrouped({
      prefix,
      delimiter: '/',
    })) {
      if (entry.type !== 'Object' || entry.key === prefix) {
        continue;
      }
      result.push({
        name: entry.key.slice(prefix.length),
        size: entry.size,
        key: entry.key,
        time: entry.lastModified.getTime(),
      });
    }
    return result;
  },
  downloadFile: async (file: FileItem) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('S3 auth not found');
    }
    const client = await createClient(auth);
    const res = await client.getObject(file.key);
    return res.text();
  },
  deleteFile: async (file: FileItem) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('S3 auth not found');
    }
    const client = await createClient(auth);
    await client.deleteObject(file.key);
  },
  writeFile: async (fileName: string, content: string) => {
    const auth = await getAuth();
    if (!auth) {
      throw new Error('S3 auth not found');
    }
    const client = await createClient(auth);
    await client.putObject(getPrefix(auth.path) + fileName, content, {
      metadata: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  },
});

export default S3;
