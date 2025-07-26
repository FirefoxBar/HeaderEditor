import { Card } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { t } from '@/share/core/utils';
import Env from './env';
import Prefs from './prefs';

interface OptionsProps {
  visible: boolean;
}

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

const Options = ({ visible }: OptionsProps) => (
  <section className={`section-options ${visible ? 'visible' : 'in-visible'}`}>
    <Card title={t('options')} className={style}>
      <Prefs />
    </Card>
    <Card title={t('env_info')} className={style}>
      <Env />
    </Card>
  </section>
);

export default Options;
