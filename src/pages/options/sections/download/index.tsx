import {
  IconDelete,
  IconDownload,
  IconEdit,
  IconSearch,
} from '@douyinfe/semi-icons';
import { Button, Card, Input, Space, Table, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useGetState, useRequest } from 'ahooks';
import { useCallback, useEffect, useRef } from 'react';
import { openURL } from '@/pages/background/utils';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import { getLocal, getSingle } from '@/share/core/storage';
import ImportDrawer from '../../components/import-drawer';

interface IEProps {
  visible: boolean;
}

function DownloadPage({ visible }: IEProps) {
  const importRef = useRef<ImportDrawer>(null);
  const [downloadUrl, setDownloadUrl, getDownloadUrl] = useGetState<string>('');
  const [downloadHistory, setDownloadHistory, getDownloadHistory] = useGetState<
    string[]
  >([]);

  useEffect(() => {
    // Load download history
    getSingle(getLocal(), 'dl_history').then(r => {
      if (Array.isArray(r)) {
        setDownloadHistory(r);
      }
    });
  }, []);

  const { run: startDownload, loading: downloading } = useRequest(
    (url: string) => fetch(url).then(res => res.json()),
    {
      manual: true,
      onSuccess: (data, params) => {
        importRef.current!.show(data);
        if (!getDownloadHistory().includes(params[0])) {
          setDownloadHistory(prev => {
            const result = [...prev, params[0]];
            getLocal().set({
              dl_history: result,
            });
            return result;
          });
        }
      },
      onError: e => {
        Toast.error((e as Error).message);
      },
    },
  );

  const handleDownload = useCallback(() => startDownload(getDownloadUrl()), []);

  return (
    <section
      className={`section-download ${visible ? 'visible' : 'in-visible'}`}
    >
      <Card title={t('download_rule')}>
        <div
          className={css`
            display: flex;
            flex-direction: row;
            gap: 8px;

            @media (max-width: 600px) {
              flex-direction: column;
            }
          `}
        >
          <Input value={downloadUrl} showClear onChange={setDownloadUrl} />
          <Button
            className="btn-icon"
            onClick={handleDownload}
            icon={<IconDownload />}
            loading={downloading}
          >
            {t('download')}
          </Button>
          <Button
            className="btn-icon"
            icon={<IconSearch />}
            onClick={() =>
              openURL({
                url: t('url_third_party_rules'),
              })
            }
          >
            {t('third_party_rules')}
          </Button>
        </div>
        <Table
          showHeader={false}
          style={{ marginTop: '8px' }}
          dataSource={downloadHistory.map(x => ({ url: x }))}
          size="small"
          columns={[
            {
              dataIndex: 'url',
            },
            {
              dataIndex: '',
              render: (_, record) => (
                <Space>
                  <Button
                    theme="borderless"
                    icon={<IconDownload />}
                    onClick={() => startDownload(record.url)}
                  >
                    {t('download')}
                  </Button>
                  <Button
                    theme="borderless"
                    icon={<IconEdit />}
                    onClick={() => setDownloadUrl(record.url)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    theme="borderless"
                    icon={<IconDelete />}
                    onClick={() => {
                      const newHistory = [...downloadHistory];
                      const index = newHistory.indexOf(record.url);
                      if (index === -1) {
                        return;
                      }
                      newHistory.splice(index, 1);
                      getLocal().set({
                        dl_history: newHistory,
                      });
                      setDownloadHistory(newHistory);
                    }}
                  >
                    {t('delete')}
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>
      <ImportDrawer ref={importRef} />
    </section>
  );
}

export default withErrorBoundary(DownloadPage);
