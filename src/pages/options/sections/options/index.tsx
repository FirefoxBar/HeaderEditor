import { Card } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { t } from '@/share/core/utils';
import Env from './env';
import Prefs from './prefs';

const style = css`
  width: 800px;
  max-width: 100%;
  margin: 0 auto;
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
  <section className="section-options">
    <Card title={t('options')} className={style}>
      <Prefs />
    </Card>
    <Card title={t('env_info')} className={style}>
      <Env />
    </Card>
  </section>
);

export default Options;
