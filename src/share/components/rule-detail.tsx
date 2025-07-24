import React, { Fragment } from 'react';
import { css, cx } from '@emotion/css';
import { t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { RULE_MATCH_TYPE, RULE_TYPE } from '../core/constant';

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
    rule.ruleType === RULE_TYPE.MODIFY_SEND_HEADER || (rule.ruleType === RULE_TYPE.MODIFY_RECV_HEADER && !rule.isFunction);

  return (
    <div
      className={cx(style, {
        [smallStyle]: size === 'small',
      })}
    >
      <p>
        {t('matchType')}: {t(`match_${rule.matchType}`)}
      </p>
      {rule.matchType !== RULE_MATCH_TYPE.ALL && (
        <p>
          {t('matchRule')}: {rule.pattern}
        </p>
      )}
      <p>
        {t('exec_type')}: {t(`exec_${rule.isFunction ? 'function' : 'normal'}`)}
      </p>
      {rule.ruleType === RULE_TYPE.REDIRECT && (
        <p>
          {t('redirectTo')}: {rule.to}
        </p>
      )}
      {rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY && (
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
