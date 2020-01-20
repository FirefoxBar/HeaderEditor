import { Button, Card, Input, Message } from '@alifd/next';
import { getExportName } from 'options/utils';
import * as React from 'react';
import Icon from 'share/components/icon';
import Api from 'share/core/api';
import file from 'share/core/file';
import { createExport } from 'share/core/ruleUtils';
import { fetchUrl, t } from 'share/core/utils';
import { TinyRule } from 'share/core/var';
import Cloud from './cloud';
import ImportDrawer from './importDrawer';
import './index.less';

interface IEProps {
  visible: boolean;
}

interface IEState {
  downloadUrl: string;
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
    file.load('.json').then(content => {
      try {
        this.importRef.current!.show(JSON.parse(content));
      } catch (e) {
        Message.error(e.message);
      }
    });
  }

  handleDownload() {
    Message.loading('loading');
    fetchUrl({
      url: this.state.downloadUrl,
    }).then(res => {
      Message.hide();
      try {
        this.importRef.current!.show(JSON.parse(res));
      } catch (e) {
        Message.error(e.message);
      }
    });
  }

  handleCloudImport(res: { [key: string]: TinyRule[] }) {
    try {
      this.importRef.current!.show(res);
    } catch (e) {
      Message.error(e.message);
    }
  }

  handleExport() {
    Api.getAllRules().then(result => file.save(JSON.stringify(createExport(result), null, '\t'), getExportName(name)));
  }

  render() {
    return (
      <section className={`section-ie ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Card showTitleBullet={false} contentHeight="auto" title={t('export_and_import')}>
          <div className="buttons">
            <Button type="secondary" onClick={this.handleExport}>
              <Icon type="save" />
              {t('export')}
            </Button>
            <Button type="secondary" onClick={this.handleImport}>
              <Icon type="folder-open" />
              {t('import')}
            </Button>
            <Button type="secondary" onClick={() => this.setState({ showCloud: true })}>
              <Icon type="cloud" />
              {t('cloud_backup')}
            </Button>
          </div>
        </Card>
        <Card showTitleBullet={false} contentHeight="auto" title={t('download_rule')}>
          <Input.Group
            addonAfter={
              <Button.Group className="download-button">
                <Button className="btn-icon" onClick={this.handleDownload}>
                  <Icon type="file-download" />
                </Button>
                <Button className="btn-icon">
                  <Icon type="search" />
                </Button>
              </Button.Group>
            }
          >
            <Input
              value={this.state.downloadUrl}
              style={{ width: '100%' }}
              onChange={downloadUrl => this.setState({ downloadUrl })}
            />
          </Input.Group>
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
