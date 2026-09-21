import {
  IconDelete,
  IconDownload,
  IconFolderOpen,
  IconImport,
  IconSave,
} from '@douyinfe/semi-icons';
import { Button, Input, Space, Spin, Table } from '@douyinfe/semi-ui';
import { useRequest } from 'ahooks';
import { useEffect, useState } from 'react';
import { withErrorBoundary } from '@/share/components/error-boundary';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import emitter from '@/share/core/emitter';
import { save as saveFile } from '@/share/pages/file';
import { Toast } from '@/share/pages/toast';
import { getExportName } from '../../utils';
import {
  type ImportAndExportContext,
  useImportAndExportContext,
} from './context';

interface FileItem {
  name: string;
  size: number;
  time: number;
  key: string;
}

interface Drive {
  name: string;
  key: string;
  onMounted?: () => undefined | (() => void);
  checkAuth: () => Promise<boolean>;
  startLogin: () => void;
  logout: () => Promise<void>;
  listFiles: () => Promise<FileItem[]>;
  downloadFile: (file: FileItem) => Promise<string>;
  deleteFile: (file: FileItem) => Promise<void>;
  writeFile: (fileName: string, content: string) => Promise<void>;
}

interface ActionBtnProps extends ImportAndExportContext {
  file: FileItem;
  onSuccess?: () => void;
}

interface FileListProps extends ImportAndExportContext {
  fileList: FileItem[];
  close: () => void;
}

const createDriveComponent = (drive: Drive) => {
  const ImportBtn = ({ file, startImport, onSuccess }: ActionBtnProps) => {
    const { loading, run } = useRequest(() => drive.downloadFile(file), {
      manual: true,
      onSuccess: content => {
        startImport(JSON.parse(content));
        onSuccess?.();
      },
      onError: error => Toast().error((error as Error).message),
    });

    return (
      <Button
        theme="borderless"
        onClick={run}
        icon={<IconImport />}
        loading={loading}
      >
        {t('import')}
      </Button>
    );
  };

  const DownloadBtn = ({ file, onSuccess }: ActionBtnProps) => {
    const { loading, run } = useRequest(() => drive.downloadFile(file), {
      manual: true,
      onSuccess: content => {
        saveFile(content, file.name);
        onSuccess?.();
      },
      onError: error => Toast().error((error as Error).message),
    });

    return (
      <Button
        theme="borderless"
        onClick={run}
        icon={<IconDownload />}
        loading={loading}
      >
        {t('download_local')}
      </Button>
    );
  };

  const DeleteBtn = ({ file, onSuccess }: ActionBtnProps) => {
    const { loading, run } = useRequest(() => drive.deleteFile(file), {
      manual: true,
      onSuccess: () => onSuccess?.(),
      onError: error => Toast().error((error as Error).message),
    });

    return (
      <Button
        onClick={() => {
          Modal.warning({
            title: t('delete_file_confirm', file.name),
            onOk: run,
          });
        }}
        icon={<IconDelete />}
        loading={loading}
        theme="borderless"
        type="danger"
      >
        {t('delete')}
      </Button>
    );
  };

  const FileList = ({ fileList, close, ...rest }: FileListProps) => {
    const [list, setList] = useState<FileItem[]>(fileList);

    return (
      <Table
        showHeader
        style={{ marginTop: '8px' }}
        dataSource={list}
        size="small"
        columns={[
          {
            title: t('filename'),
            dataIndex: 'name',
          },
          {
            title: t('filesize'),
            dataIndex: 'size',
            render: (text: number) => `${Math.round(text / 1024)} KB`,
          },
          {
            title: t('created_time'),
            dataIndex: 'time',
            render: (text: number) => new Date(text).toLocaleString(),
          },
          {
            title: t('action'),
            dataIndex: '',
            render: (_, record: FileItem) => (
              <Space>
                <ImportBtn file={record} {...rest} onSuccess={close} />
                <DownloadBtn file={record} {...rest} />
                <DeleteBtn
                  file={record}
                  {...rest}
                  onSuccess={() =>
                    setList(prev =>
                      prev.filter(item => item.key !== record.key),
                    )
                  }
                />
              </Space>
            ),
          },
        ]}
        pagination={false}
      />
    );
  };

  const DriveComponent = () => {
    const { startImport, getExportContent } = useImportAndExportContext();
    const [loading, setLoading] = useState(false);

    const {
      refresh: refreshAuth,
      data: isLoggedIn,
      loading: authLoading,
    } = useRequest(drive.checkAuth, {
      manual: false,
    });

    const { run: listFiles, loading: listLoading } = useRequest(
      drive.listFiles,
      {
        manual: true,
        onSuccess: fileList => {
          if (fileList.length === 0) {
            Toast().info(t('no_backup'));
            return;
          }

          const { destroy } = Modal.confirm({
            title: t('backup_list'),
            icon: null,
            size: 'large',
            hasCancel: false,
            content: (
              <FileList
                fileList={fileList}
                getExportContent={getExportContent}
                startImport={startImport}
                close={() => destroy()}
              />
            ),
          });
        },
        onError: error => Toast().error((error as Error).message),
      },
    );

    const { run: exportFile, loading: exportLoading } = useRequest(
      async (fileName: string) => {
        const content = await getExportContent();
        await drive.writeFile(fileName, JSON.stringify(content, null, '\t'));
      },
      {
        manual: true,
        onSuccess: () => Toast().success(t('export_success')),
        onError: error => Toast().error((error as Error).message),
      },
    );

    const { run: logout, loading: logoutLoading } = useRequest(drive.logout, {
      manual: true,
      onSuccess: () => {
        Toast().success(t('logout_success'));
        refreshAuth();
      },
      onError: error => Toast().error((error as Error).message),
    });

    useEffect(() => {
      const handleDriveReady = (key: string) => {
        if (drive.key === key) {
          setLoading(false);
          refreshAuth();
        }
      };
      const handleDriveLoading = (key: string) => {
        if (drive.key === key) {
          setLoading(true);
        }
      };

      let onMounted: ReturnType<NonNullable<Drive['onMounted']>>;
      if (drive.onMounted) {
        onMounted = drive.onMounted();
      }

      emitter.on(emitter.INNER_DRIVE_READY, handleDriveReady);
      emitter.on(emitter.INNER_DRIVE_LOADING, handleDriveLoading);

      return () => {
        emitter.off(emitter.INNER_DRIVE_READY, handleDriveReady);
        emitter.off(emitter.INNER_DRIVE_LOADING, handleDriveLoading);
        if (onMounted) {
          onMounted();
        }
      };
    }, []);

    if (authLoading || loading) {
      return <Spin />;
    }

    return (
      <div>
        {isLoggedIn ? (
          <Space>
            <Button
              onClick={() => {
                let fileName = getExportName();
                Modal.confirm({
                  title: t('export_filename'),
                  icon: null,
                  content: (
                    <Input
                      defaultValue={fileName}
                      onChange={value => (fileName = value)}
                    />
                  ),
                  onOk: () => {
                    if (fileName) {
                      exportFile(fileName);
                    }
                  },
                });
              }}
              icon={<IconSave />}
              loading={exportLoading}
            >
              {t('export')}
            </Button>
            <Button
              onClick={listFiles}
              icon={<IconFolderOpen />}
              loading={listLoading}
            >
              {t('show_backup')}
            </Button>
            <Button onClick={logout} type="danger" loading={logoutLoading}>
              {t('logout')}
            </Button>
          </Space>
        ) : (
          <Button onClick={() => drive.startLogin()} type="primary">
            {t('login')}
          </Button>
        )}
      </div>
    );
  };

  DriveComponent.displayName = `${drive.name}Drive`;

  return withErrorBoundary(DriveComponent);
};

export { createDriveComponent, type Drive, type FileItem };
