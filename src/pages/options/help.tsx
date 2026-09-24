import { css, cx } from '@emotion/css';
import { useEffect, useState } from 'react';
import { t } from '@/share/core/browser';
import isDarkMode from '@/share/pages/is-dark-mode';

interface Props {
  visible: boolean;
}
const Help = ({ visible }: Props) => {
  const [render, setRender] = useState(false);

  const isDark = isDarkMode() ? 1 : 0;
  let helpUrl = t('url_help');
  const gap = helpUrl.includes('?') ? '&' : '?';
  helpUrl = `${helpUrl}${gap}is_dark=${isDark}`;

  useEffect(() => {
    if (visible) {
      setRender(true);
    }
  }, [visible]);

  return (
    <section
      className={cx(
        visible ? 'visible' : 'in-visible',
        css`
          width: 100%;
          height: 100%;

          > iframe {
            border: 0;
            width: 100%;
            height: 100%;
            border-radius: var(--semi-border-radius-medium);
          }
        `,
      )}
    >
      {render && <iframe src={helpUrl} />}
    </section>
  );
};

export default Help;
