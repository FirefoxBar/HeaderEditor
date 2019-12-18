import { Button, Card, Input, Dialog, Table } from '@alifd/next';
import * as React from 'react';
import Icon from 'share/components/icon';
import { t } from 'share/core/utils';
import './index.less';
import EventEmitter from 'share/core/emit';

interface IEProps {
  visible: boolean;
}

interface IEState {
  downloadUrl: string;
  showConfirm: boolean;
  import: any;
}

export default class ImportAndExport extends React.Component<IEProps, IEState> {
  constructor(props: any) {
    super(props);
    this.state = {
      downloadUrl: '',
      showConfirm: false,
      import: [],
    };
  }

  componentDidMount() {}

  handleImportConfirm() {
    //
  }

  handleImportCancel() {
    //
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
            <Button type="secondary">
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
                <Button className="btn-icon">
                  <Icon type="file-download" />
                </Button>
                <Button className="btn-icon">
                  <Icon type="search" />
                </Button>
              </Button.Group>
            }
          >
            <Input value={this.state.downloadUrl} style={{ width: '100%' }} />
          </Input.Group>
        </Card>
        <Dialog
          title={t('import')}
          visible={this.state.showConfirm}
          onOk={this.handleImportConfirm}
          onCancel={this.handleImportCancel}
          onClose={this.handleImportCancel}
        >
          <Table dataSource={this.state.import}>
            <Table.Column title={t('name')} dataIndex="name" />
            <Table.Column title={t('ruleType')} dataIndex="ruleType" cell={(value: string) => t(`rule_${value}`)} />
            <Table.Column title={t('suggested_group')} dataIndex="group" cell={(value: string) => <span />} />
          </Table>
        </Dialog>
      </section>
    );
  }
}
