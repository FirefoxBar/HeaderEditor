import { Typography } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import type { FC, PropsWithChildren, ReactNode } from 'react';

const style = css`
  flex-grow: 1;
  flex-shrink: 1;
  height: 100vh;
  overflow: auto;
  box-sizing: border-box;
  padding: 16px;
  background-color: var(--semi-color-fill-0);
  padding-bottom: 0;

  > .header {
    display: flex;
    flex-direction: row;
    padding-bottom: 16px;

    > .space {
      flex-grow: 1;
      flex-shrink: 1;
    }
  }

  > .content {
    height: calc(100vh - 72px);
    overflow: auto;
    display: flex;
    flex-direction: row;

    > .left {
      flex-grow: 1;
      flex-shrink: 1;
      width: 100%;
      padding-bottom: 16px;
      overflow: auto;
    }

      > .right {
        width: 320px;
        padding-left: 16px;
        padding-bottom: 16px;
        overflow: auto;
      }
  }
`;

type LayoutProps = PropsWithChildren<{
  title: string;
  extra?: ReactNode;
  className?: string;
  right?: ReactNode;
}>;

export const Layout: FC<LayoutProps> = ({
  title,
  extra,
  className,
  right,
  children,
}) => (
  <main className={cx(className, style)}>
    <div className="header">
      <Typography.Title heading={2}>{title}</Typography.Title>
      <div className="space" />
      <div className="right">{extra}</div>
    </div>
    <div className="content">
      <div className="left">{children}</div>
      {right && <div className="right">{right}</div>}
    </div>
  </main>
);
