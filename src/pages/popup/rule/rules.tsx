import React, { useEffect } from 'react';
import { useLatest, useRequest } from 'ahooks';
import { Button, Popover, Spin, Switch } from '@douyinfe/semi-ui';
import { IconBranch } from '@douyinfe/semi-icons';
import { css, cx } from '@emotion/css';
import Api from '@/share/pages/api';
import { getVirtualKey, parseVirtualKey } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { VIRTUAL_KEY, EVENTs } from '@/share/core/constant';
import useMarkCommon from '@/share/hooks/use-mark-common';
import RuleDetail from '@/share/components/rule-detail';
import notify from '@/share/core/notify';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import { textEllipsis } from '@/share/pages/styles';
import QuickEdit from './quick-edit';

const Rules = () => {
  const { keys } = useMarkCommon('rule');
  const keysRef = useLatest(keys);
  const { data = [], loading, mutate } = useRequest(() =>
    Promise.all(
      keys.map(async (key) => {
        const item = parseVirtualKey(key);
        const result = await Api.getRules(item.table, {
          id: item.id,
        });
        return {
          ...result[0],
          [VIRTUAL_KEY]: key,
        };
      }),
    ),
  {
    manual: false,
    refreshDeps: [keys],
  });

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const rule: Rule = request.target;
      const key = getVirtualKey(rule);
      if (keysRef.current.includes(key)) {
        mutate((currentData) => {
          if (!currentData) {
            return;
          }
          const index = currentData.findIndex((x) => x[VIRTUAL_KEY] === key);
          if (index === -1) {
            return currentData;
          }
          const result = [...currentData];
          result.splice(index, 1, {
            ...rule,
            [VIRTUAL_KEY]: key,
          });
          return result;
        });
      }
    };

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
    };
  }, []);

  if (data.length === 0 && !loading) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <div className={css`
        display: flex;
        flex-direction: column;

        > .item {
          display: flex;
          flex-direction: row;
          gap: 8px;
          align-items: center;
          background-color: #fff;
          border-top: 1px solid var(--semi-color-border);
          padding-left: 8px;
          padding-right: 8px;

          > * {
            flex-grow: 0;
            flex-shrink: 0;
          }

          > .name {
            flex-grow: 1;
            flex-shrink: 1;
            font-size: 14px;
            padding-top: 8px;
            padding-bottom: 8px;
          }
        }
      `}
      >
        {data.map((item) => (
          <div className="item" key={item[VIRTUAL_KEY]}>
            <Switch
              size="small"
              checked={item.enable}
              onChange={(checked) => Api.saveRule({
                ...item,
                enable: checked,
              })}
            />
            <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
              <div className={cx(textEllipsis, 'name')}>{item.name}</div>
            </Popover>
            <div className="actions">
              <QuickEdit rule={item} />
              <RuleContentSwitcher rule={item} type={item.ruleType} size="small" add={false}>
                <Button theme="borderless" type="tertiary" size="small" icon={<IconBranch />} />
              </RuleContentSwitcher>
            </div>
          </div>
        ))}
      </div>
    </Spin>
  );
};

export default Rules;
