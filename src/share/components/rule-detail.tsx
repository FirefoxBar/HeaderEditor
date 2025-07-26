import React from 'react';
import { css, cx } from '@emotion/css';
import { Descriptions, Tag } from '@douyinfe/semi-ui';
import { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import { t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { RULE_TYPE } from '../core/constant';
import { tagList } from '../pages/styles';

interface RuleDetailProps {
  rule: Rule;
  size?: 'small' | 'default';
}

const style = css`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  .semi-descriptions-key {
    font-size: 14px;
  }
  .semi-descriptions-item {
    padding-bottom: 8px;
  }
  th {
    padding-right: 12px;
  }
  p {
    margin: 0;
  }
`;

const smallStyle = css`
  font-size: 12px;
  .semi-descriptions-key,
  .semi-descriptions-value {
    font-size: 12px;
  }
  .semi-descriptions-item {
    padding-bottom: 4px;
  }
  th {
    padding-right: 4px;
  }
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
              {t('match_url')}
              <Tag color="grey" size="small" shape="circle">
                {condition.url}
              </Tag>
            </p>
          )}
          {condition.urlPrefix && (
            <p>
              {t('match_prefix')}
              <Tag color="grey" size="small" shape="circle">
                {condition.urlPrefix}
              </Tag>
            </p>
          )}
          {condition.domain && (
            <p>
              {t('match_domain')}
              <div className={tagList}>
                {condition.domain.map((k) => (
                  <Tag color="grey" key={k} size="small" shape="circle">
                    {k}
                  </Tag>
                ))}
              </div>
            </p>
          )}
          {condition.method && (
            <p>
              {t('match_method')}
              <div className={tagList}>
                {condition.method.map((k) => (
                  <Tag color="grey" key={k} size="small" shape="circle">
                    {k.toUpperCase()}
                  </Tag>
                ))}
              </div>
            </p>
          )}
          {condition.resourceTypes && (
            <p>
              {t('match_resourceType')}
              <div className={tagList}>
                {condition.resourceTypes.map((e) => (
                  <Tag color="grey" key={e} size="small" shape="circle">
                    {t(`resourceType_${e}`)}
                  </Tag>
                ))}
              </div>
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
        value: (
          <div className={tagList}>
            {Object.keys(rule.headers || {}).map((k) => (
              <Tag color="grey" key={k} size="small" shape="circle">
                {k}: {rule.headers![k]}
              </Tag>
            ))}
          </div>
        ),
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
          .semi-tag {
            height: auto;
          }
          .semi-tag-content {
            white-space: normal;
            word-break: break-all;
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
