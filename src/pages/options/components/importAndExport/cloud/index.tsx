import Icon from '@/share/components/icon';
import Api from '@/share/core/api';
import browserSync from '@/share/core/browserSync';
import { createExport } from '@/share/core/ruleUtils';
import { t } from '@/share/core/utils';
import { TinyRule } from '@/share/core/var';
import { Message } from '@alifd/next';
import { Button, Modal, Tag } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import dayjs from 'dayjs';
import * as React from 'react';
import './index.less';

interface CloudProps {
  visible: boolean;
  onClose: () => void;
  onImport: (rules: { [key: string]: TinyRule[] }) => void;
}

interface CloudState {
  has: boolean;
  time: number;
}

export default class Cloud extends React.Component<CloudProps, CloudState> {
  constructor(props: any) {
    super(props);

    this.handleDelete = this.handleDelete.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleDownload = this.handleDownload.bind(this);

    this.state = {
      has: false,
      time: 0,
    };
  }

  private refresh() {
    browserSync.getMeta().then((r) => {
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
    Api.getAllRules()
      .then((result) => browserSync.save(createExport(result)))
      .then(() => browserSync.getMeta())
      .then(() => this.refresh())
      .catch(() => Message.error('cloud_over_limit'));
  }

  handleDownload() {
    this.props.onClose();
    browserSync.getContent().then((r) => {
      this.props.onImport(r);
    });
  }

  handleDelete(from: string) {
    browserSync.clear().then(() =>
      this.setState({
        has: false,
        time: 0,
      }));
    return true;
  }

  handleHelp() {
    Api.openURL(t('url_cloud_backup'));
  }

  render() {
    return (
      <Modal
        className={css`
          width: 480px;
          font-size: 14px;

          .next-tag {
            border: none;

            .next-tag-body {
              padding-left: 0;
            }
          }
        `}
        title={t('cloud_backup')}
        footer={
          <div className="buttons">
            <Button type="secondary" onClick={this.handleHelp} icon={<Icon type="open-in-new" />}>
              {t('help')}
            </Button>
            <Button theme="solid" type="primary" onClick={this.handleDownload} disabled={!this.state.has} icon={<Icon type="cloud-download" />}>
              {t('download')}
            </Button>
            <Button theme="solid" type="primary" onClick={this.handleUpload} icon={<Icon type="cloud-upload" />}>
              {t('upload')}
            </Button>
          </div>
        }
        visible={this.props.visible}
        onCancel={this.props.onClose}
      >
        {this.state.has && (
          <Tag closable size="large" onClose={this.handleDelete}>
            {t('cloud_backup_at', dayjs(this.state.time).format('lll'))}
          </Tag>
        )}
        {!this.state.has && t('cloud_no_backup')}
      </Modal>
    );
  }
}
