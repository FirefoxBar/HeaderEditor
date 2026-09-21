import { Card } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { withErrorBoundary } from '@/share/components/error-boundary';
import { t } from '@/share/core/browser';
import Env from './env';
import Popup from './popup';
import Prefs from './prefs';

interface OptionsProps {
  visible: boolean;
}

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

const Options = withErrorBoundary(({ visible }: OptionsProps) => (
  <section
    className={`section-options tow-row ${visible ? 'visible' : 'in-visible'}`}
  >
    <div>
      <Card title={t('options')} className={style}>
        <Prefs />
      </Card>
    </div>
    <div>
      <Card title={t('popupPanel')} className={style}>
        <Popup />
      </Card>
      <Card title={t('env_info')} className={style}>
        <Env />
      </Card>
    </div>
  </section>
));

export default Options;
