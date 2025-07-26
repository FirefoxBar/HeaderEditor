import { css } from '@emotion/css';

export const textEllipsis = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const tagList = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  > .semi-tag {
    flex: 0 1 auto;
    max-width: 100%;
    box-sizing: border-box;
  }
`;
