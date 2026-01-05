import { css } from '@emotion/css';
import { t } from '@/share/core/utils';

const Help = () => (
  <div
    className={css`
      width: 100%;
      height: 100%;

      > iframe {
        border: 0;
        width: 100%;
        height: 100%;
      }
    `}
  >
    <iframe src={t('url_help')} />
  </div>
);

export default Help;
