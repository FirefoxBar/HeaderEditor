import React, { useEffect } from 'react';
import { useLatest, useRequest } from 'ahooks';
import { Popover, Switch, Table } from '@douyinfe/semi-ui';
import Api from '@/share/pages/api';
import { getVirtualKey, parseVirtualKey } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { VIRTUAL_KEY, EVENTs } from '@/share/core/constant';
import useMarkCommon from '@/share/hooks/use-mark-common';
import RuleDetail from '@/share/components/rule-detail';
import notify from '@/share/core/notify';

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
    <Table
      rowKey={VIRTUAL_KEY}
      loading={loading}
      dataSource={data}
      showHeader={false}
      size="small"
      columns={[
        {
          title: 'enable',
          dataIndex: 'enable',
          className: 'cell-enable',
          align: 'center',
          width: 30,
          render: (value: boolean, item: Rule) => (
            <div className="switch-container">
              <Switch
                size="small"
                checked={value}
                onChange={(checked) => {
                  item.enable = checked;
                  return Api.saveRule(item);
                }}
              />
            </div>
          ),
        },
        {
          title: 'name',
          dataIndex: 'name',
          render: (value: string, item: Rule) => (
            <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
              <div>{value}</div>
            </Popover>
          ),
        },
      ]}
      pagination={false}
    />
  );
};

export default Rules;
