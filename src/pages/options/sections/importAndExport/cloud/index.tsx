import { IconDownload, IconUpload, IconExternalOpen } from '@douyinfe/semi-icons';
import { Button, Modal, Tag, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import dayjs from 'dayjs';
import * as React from 'react';
import Api from '@/share/pages/api';
import browserSync from '@/share/pages/browser-sync';
import { createExport } from '@/share/core/rule-utils';
import { t } from '@/share/core/utils';
import type { BasicRule } from '@/share/core/types';

interface CloudProps {
  visible: boolean;
  onClose: () => void;
  onImport: (rules: { [key: string]: BasicRule[] }) => void;
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
      .catch(() => Toast.error('cloud_over_limit'));
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
            <Button type="secondary" onClick={this.handleHelp} icon={<IconExternalOpen />}>
              {t('help')}
            </Button>
            <Button theme="solid" type="primary" onClick={this.handleDownload} disabled={!this.state.has} icon={<IconDownload />}>
              {t('download')}
            </Button>
            <Button theme="solid" type="primary" onClick={this.handleUpload} icon={<IconUpload />}>
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
