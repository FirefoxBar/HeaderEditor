import { css, cx } from '@emotion/css';
import { useEffect, useState } from 'react';
import { getHelpUrl } from '@/share/pages/get-help-url';

interface Props {
  visible: boolean;
}
const Help = ({ visible }: Props) => {
  const [render, setRender] = useState(false);

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
      {render && <iframe src={getHelpUrl()} />}
    </section>
  );
};

export default Help;
