import {
  IconCloud,
  IconDownload,
  IconFolderOpen,
  IconSave,
  IconSearch,
} from '@douyinfe/semi-icons';
import { Button, Card, Input, Space, Table, Toast } from '@douyinfe/semi-ui';
import * as React from 'react';
import { openURL } from '@/pages/background/utils';
import { getLocal, readStorage } from '@/share/core/storage';
import type { BasicRule } from '@/share/core/types';
import { fetchUrl, t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import file from '@/share/pages/file';
import { Layout } from '../layout';
import { batchShare } from '../rules/utils';
import Cloud from './cloud';
import ImportDrawer from './import-drawer';

interface IEState {
  downloadUrl: string;
  downloading: boolean;
  showCloud: boolean;
  downloadHistory: string[];
}

export default class ImportAndExport extends React.Component<{}, IEState> {
  private importRef: React.RefObject<ImportDrawer> = React.createRef();
  constructor(props: any) {
    super(props);

    this.handleImport = this.handleImport.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.handleCloudImport = this.handleCloudImport.bind(this);

    this.state = {
      downloadUrl: '',
      downloading: false,
      showCloud: false,
      downloadHistory: [],
    };
  }

  async componentDidMount() {
    // Load download history
    const his = await readStorage(getLocal(), 'dl_history');
    if (Array.isArray(his)) {
      this.setState({
        downloadHistory: his,
      });
    }
  }

  handleImport() {
    file.load('.json').then(content => {
      try {
        this.importRef.current!.show(JSON.parse(content));
      } catch (e) {
        Toast.error((e as Error).message);
      }
    });
  }

  async handleDownload() {
    this.setState({ downloading: true });
    try {
      const res = await fetchUrl({
        url: this.state.downloadUrl,
      });
      this.importRef.current!.show(JSON.parse(res));

      if (!this.state.downloadHistory.includes(this.state.downloadUrl)) {
        this.setState(prevState => {
          const newHistory = [
            this.state.downloadUrl,
            ...prevState.downloadHistory,
          ];
          getLocal().set({
            dl_history: newHistory,
          });
          return {
            downloadHistory: newHistory,
          };
        });
      }
    } catch (e) {
      Toast.error((e as Error).message);
    }
    this.setState({ downloading: false });
  }

  handleCloudImport(res: { [key: string]: BasicRule[] }) {
    try {
      this.importRef.current!.show(res);
    } catch (e) {
      Toast.error((e as Error).message);
    }
  }

  async handleExport() {
    const result = await Api.getAllRules();
    const tasks = await Api.getTasks();
    batchShare(Object.values(result).flat(), tasks);
  }

  handleOpenThird() {
    openURL({
      url: t('url_third_party_rules'),
    });
  }

  render() {
    return (
      <Layout
        title={t('export_and_import')}
        right={
          <Card>
            <Space vertical align="start">
              <Button onClick={this.handleExport} icon={<IconSave />}>
                {t('export')}
              </Button>
              <Button onClick={this.handleImport} icon={<IconFolderOpen />}>
                {t('import')}
              </Button>
              <Button
                onClick={() => this.setState({ showCloud: true })}
                icon={<IconCloud />}
              >
                {t('cloud_backup')}
              </Button>
            </Space>
          </Card>
        }
      >
        <Card title={t('download_rule')}>
          <Space style={{ width: '100%' }}>
            <Input
              value={this.state.downloadUrl}
              style={{ width: '100%' }}
              showClear
              onChange={downloadUrl => this.setState({ downloadUrl })}
            />
            <Button
              className="btn-icon"
              onClick={this.handleDownload}
              icon={<IconDownload />}
              loading={this.state.downloading}
            >
              {t('download')}
            </Button>
            <Button
              className="btn-icon"
              icon={<IconSearch />}
              onClick={this.handleOpenThird}
            >
              {t('third_party_rules')}
            </Button>
          </Space>
          <Table
            showHeader={false}
            style={{ marginTop: '8px' }}
            dataSource={this.state.downloadHistory.map(x => ({ url: x }))}
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
                        this.setState(
                          {
                            downloadUrl: record.url,
                          },
                          () => this.handleDownload(),
                        );
                      }}
                    >
                      {t('download')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        this.setState({
                          downloadUrl: record.url,
                        });
                      }}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        this.setState(prevState => {
                          const newHistory = [...prevState.downloadHistory];
                          const index = newHistory.indexOf(record.url);
                          if (index === -1) {
                            return null;
                          }
                          newHistory.splice(index, 1);
                          getLocal().set({
                            dl_history: newHistory,
                          });
                          return {
                            downloadHistory: newHistory,
                          };
                        });
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
        <ImportDrawer ref={this.importRef} />
        <Cloud
          visible={this.state.showCloud}
          onClose={() => this.setState({ showCloud: false })}
          onImport={this.handleCloudImport}
        />
      </Layout>
    );
  }
}
