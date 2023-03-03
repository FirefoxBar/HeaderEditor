import { getExportName } from '@/pages/options/utils';
import * as React from 'react';
import Icon from '@/share/components/icon';
import Api from '@/share/core/api';
import file from '@/share/core/file';
import { createExport } from '@/share/core/ruleUtils';
import { fetchUrl, t } from '@/share/core/utils';
import { TinyRule } from '@/share/core/var';
import Cloud from './cloud';
import ImportDrawer from './importDrawer';
import './index.less';
import { Button, ButtonGroup, Card, Input, Spin, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';

interface IEProps {
  visible: boolean;
}

interface IEState {
  downloadUrl: string;
  downloading: boolean;
  showCloud: boolean;
}

export default class ImportAndExport extends React.Component<IEProps, IEState> {
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
    };
  }

  componentDidMount() {
    /*
		// Load download history
		storage.getLocal().get('dl_history').then(r => {
			if (r.dl_history !== undefined) {
				this.$set(this.download, 'log', r.dl_history);
			}
			this.$watch('download.log', newDl => {
				storage.getLocal().set({
					dl_history: newDl
				});
			});
    });
    */
  }

  handleImportConfirm() {
    //
  }

  handleImportCancel() {
    //
  }

  handleImport() {
    file.load('.json').then((content) => {
      try {
        this.importRef.current!.show(JSON.parse(content));
      } catch (e) {
        Toast.error(e.message);
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
    } catch (e) {
      Toast.error(e.message);
    }
    this.setState({ downloading: false });
  }

  handleCloudImport(res: { [key: string]: TinyRule[] }) {
    try {
      this.importRef.current!.show(res);
    } catch (e) {
      Toast.error(e.message);
    }
  }

  handleExport() {
    Api.getAllRules().then((result) => file.save(JSON.stringify(createExport(result), null, '\t'), getExportName(name)));
  }

  render() {
    return (
      <section className={`section-ie ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Card title={t('export_and_import')}>
          <div className={css`
            > .semi-button {
              margin-right: 8px;
            }
          `}
          >
            <Button onClick={this.handleExport} icon={<Icon type="save" />}>
              {t('export')}
            </Button>
            <Button onClick={this.handleImport} icon={<Icon type="folder-open" />}>
              {t('import')}
            </Button>
            <Button onClick={() => this.setState({ showCloud: true })} icon={<Icon type="cloud" />}>
              {t('cloud_backup')}
            </Button>
          </div>
        </Card>
        <Card title={t('download_rule')}>
          <Input
            addonAfter={
              <ButtonGroup className="download-button">
                <Button className="btn-icon" onClick={this.handleDownload} icon={<Icon type="file-download" />} loading={this.state.downloading} />
                <Button className="btn-icon">
                  <Icon type="search" />
                </Button>
              </ButtonGroup>
            }
            value={this.state.downloadUrl}
            style={{ width: '100%' }}
            onChange={(downloadUrl) => this.setState({ downloadUrl })}
          />
        </Card>
        <ImportDrawer ref={this.importRef} />
        <Cloud
          visible={this.state.showCloud}
          onClose={() => this.setState({ showCloud: false })}
          onImport={this.handleCloudImport}
        />
      </section>
    );
  }
}
