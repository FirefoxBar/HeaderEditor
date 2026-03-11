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
  overflow: hidden;
  max-width: 100%;

  .semi-tag-content-center {
    overflow: hidden;
  }

  .item-tag {
    display: flex;
    overflow: hidden;
    flex: 0 1 auto;
    max-width: 100%;
    box-sizing: border-box;

    > .key,
    > .value {
      flex-grow: 0;
      flex-shrink: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    > .sp {
      padding-right: 2px;
      flex-grow: 0;
      flex-shrink: 0;
    }
  }
`;
