import { Button, Dialog, Message, Tag } from '@alifd/next';
import moment from 'moment';
import * as React from 'react';
import Icon from 'share/components/icon';
import browserSync from 'share/core/browserSync';
import rules from 'share/core/rules';
import { t } from 'share/core/utils';
import { Rule, TABLE_NAMES } from 'share/core/var';
import { browser } from 'webextension-polyfill-ts';
import './index.less';

interface CloudProps {
  visible: boolean;
  onClose: () => void;
  onImport: (rules: { [key: string]: Rule[] }) => void;
}

interface CloudState {
  has: boolean;
  time: number;
}

export default class Cloud extends React.Component<CloudProps, CloudState> {
  constructor(props: any) {
    super(props);

    this.handleDetele = this.handleDetele.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleDownload = this.handleDownload.bind(this);

    this.state = {
      has: false,
      time: 0,
    };
  }

  private refresh() {
    browserSync.getMeta().then(r => {
      if (r && r.time) {
        this.setState({
          has: true,
          time: r.time,
        });
      }
    });
  }

  componentDidMount() {
    this.refresh();
  }

  handleUpload() {
    const result: any = {};
    TABLE_NAMES.forEach(k => (result[k] = rules.get(k)));
    browserSync
      .save(rules.createExport(result))
      .then(() => browserSync.getMeta())
      .then(() => this.refresh())
      .catch(() => Message.error('cloud_over_limit'));
  }

  handleDownload() {
    this.props.onClose();
    browserSync.getContent().then(r => {
      this.props.onImport(r);
    });
  }

  handleDetele(from: string) {
    browserSync.clear().then(() =>
      this.setState({
        has: false,
        time: 0,
      }),
    );
    return true;
  }

  handleHelp() {
    browser.runtime.sendMessage({
      method: 'openURL',
      url: t('url_cloud_backup'),
    });
  }

  render() {
    return (
      <Dialog
        className="cloud-dialog"
        title={t('cloud_backup')}
        footer={
          <div className="buttons">
            <Button type="secondary" onClick={this.handleUpload}>
              <Icon type="cloud-upload" />
              {t('upload')}
            </Button>
            <Button type="secondary" onClick={this.handleDownload} disabled={!this.state.has}>
              <Icon type="cloud-download" />
              {t('download')}
            </Button>
            <Button onClick={this.handleHelp}>
              <Icon type="open-in-new" />
              {t('help')}
            </Button>
            <Button onClick={this.props.onClose}>close</Button>
          </div>
        }
        visible={this.props.visible}
      >
        {this.state.has && (
          <Tag.Closeable onClose={this.handleDetele}>
            {t('cloud_backup_at', moment(this.state.time).format('lll'))}
          </Tag.Closeable>
        )}
        {!this.state.has && t('cloud_no_backup')}
      </Dialog>
    );
  }
}
