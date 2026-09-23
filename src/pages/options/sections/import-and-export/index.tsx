import { Card, Space } from '@douyinfe/semi-ui';
import { useCallback, useRef } from 'react';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import { createExport } from '@/share/core/rule-utils';
import Api from '@/share/pages/api';
import ImportDrawer from '../../components/import-drawer';
import BrowserSync from './browser-sync';
import { ImportAndExportContext, type ImportContent } from './context';
import GoogleDrive from './google-drive';
import LocalFile from './local-file';
import OneDrive from './onedrive';
import S3 from './s3';
import WebDAV from './webdav';
import Yandex from './yandex';

const getExportContent = async () => {
  const result = await Api.getAllRules();
  return createExport(result) as ImportContent;
};

interface Props {
  visible: boolean;
}

const ImportAndExport = ({ visible }: Props) => {
  const importRef = useRef<ImportDrawer>(null);

  const startImport = useCallback((content: ImportContent) => {
    importRef.current!.show(content);
  }, []);

  return (
    <section
      className={`section-import-export two-row ${visible ? 'visible' : 'in-visible'}`}
    >
      <ImportAndExportContext.Provider
        value={{ startImport, getExportContent }}
      >
        <div>
          <Card title={t('local_file')}>
            <Space>
              <LocalFile />
              <BrowserSync />
            </Space>
          </Card>
          <Card title="WebDAV">
            <WebDAV />
          </Card>
          <Card title="S3">
            <S3 />
          </Card>
        </div>
        <div>
          <Card title="OneDrive">
            <OneDrive />
          </Card>
          <Card title="Google Drive">
            <GoogleDrive />
          </Card>
          <Card title="Yandex">
            <Yandex />
          </Card>
        </div>
      </ImportAndExportContext.Provider>
      <ImportDrawer ref={importRef} />
    </section>
  );
};

export default withErrorBoundary(ImportAndExport);
