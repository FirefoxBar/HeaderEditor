import { IconDownload, IconSearch } from '@douyinfe/semi-icons';
import { Button, Card, Input, Space, Table, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useGetState } from 'ahooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { openURL } from '@/pages/background/utils';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import { getLocal } from '@/share/core/storage';
import { fetchUrl } from '@/share/core/utils';
import ImportDrawer from '../../components/import-drawer';

interface IEProps {
  visible: boolean;
}

function DownloadPage({ visible }: IEProps) {
  const importRef = useRef<ImportDrawer>(null);
  const [downloadUrl, setDownloadUrl, getDownloadUrl] = useGetState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadHistory, setDownloadHistory, getDownloadHistory] = useGetState<
    string[]
  >([]);

  useEffect(() => {
    // Load download history
    getLocal()
      .get('dl_history')
      .then(r => {
        if (Array.isArray(r.dl_history)) {
          setDownloadHistory(r.dl_history);
        }
      });
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const u = getDownloadUrl();
      const res = await fetchUrl({
        url: u,
      });
      importRef.current!.show(JSON.parse(res));

      if (!getDownloadHistory().includes(u)) {
        setDownloadHistory(prev => {
          const result = [...prev, u];
          getLocal().set({
            dl_history: result,
          });
          return result;
        });
      }
    } catch (e) {
      Toast.error((e as Error).message);
      setDownloading(false);
    }
  }, []);

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
                    size="small"
                    onClick={() => {
                      setDownloadUrl(record.url);
                      handleDownload();
                    }}
                  >
                    {t('download')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setDownloadUrl(record.url);
                    }}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    size="small"
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
