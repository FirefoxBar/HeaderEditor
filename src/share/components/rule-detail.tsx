import React from 'react';
import { css, cx } from '@emotion/css';
import { Descriptions, Typography } from '@douyinfe/semi-ui';
import { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import { t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { RULE_TYPE } from '../core/constant';

const { Text } = Typography;

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

  const isSendHeader = RULE_TYPE.MODIFY_SEND_HEADER === rule.ruleType;
  const isRecvHeader = RULE_TYPE.MODIFY_RECV_HEADER === rule.ruleType;

  const isModifyHeader = (isSendHeader || isRecvHeader) && !rule.isFunction;

  const { condition = {} } = rule;

  const list = [
    {
      key: t('matchType'),
      value: (
        <div>
          {condition.all && <p>{t('match_all')}</p>}
          {condition.url && (
            <p>
              {t('match_url')}: {condition.url}
            </p>
          )}
          {condition.urlPrefix && (
            <p>
              {t('match_prefix')}: {condition.urlPrefix}
            </p>
          )}
          {condition.domain && (
            <p>
              {t('match_domain')}: {condition.domain.join('/')}
            </p>
          )}
          {condition.method && (
            <p>
              {t('match_method')}: {condition.method.join('/')}
            </p>
          )}
          {condition.resourceTypes && (
            <p>
              {t('match_resourceType')}: {condition.resourceTypes.map((e) => t(`resourceType_${e}`)).join('/')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: t('exec_type'),
      value: t(`exec_${rule.isFunction ? 'function' : 'normal'}`),
    },
    rule.ruleType === RULE_TYPE.REDIRECT
      ? {
        key: t('redirectTo'),
        value: rule.to,
      }
      : undefined,

    rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY
      ? {
        key: t('encoding'),
        value: rule.encoding,
      }
      : undefined,
    isModifyHeader
      ? {
        key: t(isSendHeader ? 'request_headers' : 'response_headers'),
        value: Object.keys(rule.headers || {}).map((k) => (
          <Text code key={k}>
            {k}: {rule.headers![k]}
          </Text>
        )),
      }
      : undefined,
  ].filter(Boolean) as Data[];

  return (
    <Descriptions
      className={cx(
        style,
        css`
          > table tr:last-child > .semi-descriptions-item {
            padding-bottom: 0;
          }
          .semi-typography {
            display: block;
            margin-bottom: 4px;

            > code {
              display: block;
            }

            &:last-child {
              margin-bottom: 0;
            }
          }
        `,
        {
          [smallStyle]: size === 'small',
        },
      )}
      data={list}
    />
  );
};

export default RuleDetail;
