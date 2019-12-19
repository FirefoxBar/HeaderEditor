import { Button, Card, Drawer, Input, Select, Table } from '@alifd/next';
import * as React from 'react';
import Icon from 'share/components/icon';
import rules from 'share/core/rules';
import { isTableName, t, TABLE_NAMES } from 'share/core/utils';
import { ImportRule, TinyRule } from 'share/core/var';
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
    this.state = {
      downloadUrl: '',
    };
  }

  componentDidMount() {
    // if (this.importRef.current) {
    //   this.importRef.current.show()
    // }
  }

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
        <ImportDrawer ref={this.importRef} />
      </section>
    );
  }
}
