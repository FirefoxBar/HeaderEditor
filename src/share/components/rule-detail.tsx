import React, { Fragment } from 'react';
import { css, cx } from '@emotion/css';
import { t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';

interface RuleDetailProps {
  rule: Rule;
  size?: 'small' | 'default';
}

const style = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  p {
    margin: 0;
    overflow: hidden;
    word-break: break-all;
    text-overflow: ellipsis;
    display: box;
    box-orient: vertical;
    line-clamp: 3;
  }
`;

const smallStyle = css`
  gap: 4px;
  font-size: 12px;
`;

const RuleDetail = (props: RuleDetailProps) => {
  const { rule, size } = props;

  const isModifyHeader =
    rule.ruleType === 'modifySendHeader' || (rule.ruleType === 'modifyReceiveHeader' && !rule.isFunction);

  return (
    <div
      className={cx(style, {
        [smallStyle]: size === 'small',
      })}
    >
      <p>
        {t('matchType')}: {t(`match_${rule.matchType}`)}
      </p>
      {rule.matchType !== 'all' && (
        <p>
          {t('matchRule')}: {rule.pattern}
        </p>
      )}
      <p>
        {t('exec_type')}: {t(`exec_${rule.isFunction ? 'function' : 'normal'}`)}
      </p>
      {rule.ruleType === 'redirect' && (
        <p>
          {t('redirectTo')}: {rule.to}
        </p>
      )}
      {rule.ruleType === 'modifyReceiveBody' && (
        <p>
          {t('encoding')}: {rule.encoding}
        </p>
      )}
      {isModifyHeader && (
        <Fragment>
          <p>
            {t('headerName')}: {typeof rule.action === 'object' && rule.action.name}
          </p>
          <p>
            {t('headerValue')}: {typeof rule.action === 'object' && rule.action.value}
          </p>
        </Fragment>
      )}
    </div>
  );
};

export default RuleDetail;
