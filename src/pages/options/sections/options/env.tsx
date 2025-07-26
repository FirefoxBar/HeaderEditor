import { Button, List, Toast, Typography } from '@douyinfe/semi-ui';
import { useRequest } from 'ahooks';
import React from 'react';
import browser from 'webextension-polyfill';
import { t } from '@/share/core/utils';

const Env = () => {
  const manifest = browser.runtime.getManifest();

  const { run: doCheckUpdate, loading: checking } = useRequest(() => browser.runtime.requestUpdateCheck(), {
    manual: true,
    onSuccess: (data) => {
      switch (data[0]) {
        case 'no_update':
          Toast.info(t('no_update'));
          break;
        case 'throttled':
          Toast.warning(t('update_throttled'));
          break;
        case 'update_available':
          Toast.success(t('update_available'));
          break;
        default:
          Toast.info(data[0]);
      }
    },
  });

  return (
    <List
      dataSource={[
        {
          label: t('ext_version'),
          content: `${manifest.name} ${manifest.version} manifest v${manifest.manifest_version}`,
        },
        { label: t('browser_version'), content: navigator.userAgent },
        {
          label: t('check_update'),
          content: t('check_update'),
          extra: (
            <Button type="primary" theme="solid" loading={checking} onClick={doCheckUpdate}>
              {t('check_update')}
            </Button>
          ),
        },
      ]}
      renderItem={(item) => (
        <List.Item
          key={item.label}
          main={
            <div className="list-item">
              <Typography.Text className="title">{item.label}</Typography.Text>
              <Typography.Text type="quaternary" className="content">
                {item.content}
              </Typography.Text>
            </div>
          }
          extra={item.extra}
        />
      )}
    />
  );
};

export default Env;
