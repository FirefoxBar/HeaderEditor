import { Card } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { t } from '@/share/core/utils';
import { Layout } from '../layout';
import Env from './env';
import Prefs from './prefs';

const style = css`
  .semi-card-body {
    padding: 0;
  }
  .list-item {
    .title {
      display: block;
      font-weight: bold;
    }
    .content {
      font-size: 12px;
    }
  }
`;

const Options = () => (
  <Layout
    title={t('options')}
    right={
      <Card title={t('env_info')} className={style}>
        <Env />
      </Card>
    }
  >
    <Card className={style}>
      <Prefs />
    </Card>
  </Layout>
);

export default Options;
