import { Button, Card, Input, Message } from '@alifd/next';
import * as React from 'react';
import Icon from 'share/components/icon';
import file from 'share/core/file';
import { fetchUrl, t } from 'share/core/utils';
import ImportDrawer from './importDrawer';
import './index.less';

interface IEProps {
  visible: boolean;
}

interface IEState {
  downloadUrl: string;
}

export default class ImportAndExport extends React.Component<IEProps, IEState> {
  private importRef: React.RefObject<ImportDrawer> = React.createRef();
  constructor(props: any) {
    super(props);

    this.handleImport = this.handleImport.bind(this);
    this.handleDownload = this.handleDownload.bind(this);

    this.state = {
      downloadUrl: '',
    };
  }

  componentDidMount() {}

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

  render() {
    return (
      <section className={`section-ie ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Card showTitleBullet={false} contentHeight="auto" title={t('export_and_import')}>
          <div className="buttons">
            <Button type="secondary">
              <Icon type="save" />
              {t('export')}
            </Button>
            <Button type="secondary" onClick={this.handleImport}>
              <Icon type="folder-open" />
              {t('import')}
            </Button>
            <Button type="secondary">
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
      </section>
    );
  }
}
