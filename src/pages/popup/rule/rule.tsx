import React from 'react';
import { useRequest } from 'ahooks';
import { Popover, Switch, Table } from '@douyinfe/semi-ui';
import Api from '@/share/core/api';
import { parseVirtualKey } from '@/share/core/utils';
import { VIRTUAL_KEY } from '@/share/core/var';
import useMarkCommon from '@/share/hooks/useMarkCommon';
import RuleDetail from '@/share/components/rule-detail';
import { InitdRule } from '@/share/core/var';

const Rule = () => {
  const { keys } = useMarkCommon('rule');
  const { data = [], loading, refresh } = useRequest(() =>
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
      })
    ),
    {
      manual: false,
      refreshDeps: [keys],
    }
  );

  if (data.length === 0 && !loading) {
    return null;
  }

  return (
    <Table
      rowKey={VIRTUAL_KEY}
      loading={loading}
      dataSource={data}
      showHeader={false}
      columns={[
        {
          title: 'enable',
          dataIndex: 'enable',
          className: 'cell-enable',
          align: 'center',
          width: 30,
          render: (value: boolean, item: InitdRule) => (
            <div className="switch-container">
              <Switch
                size="small"
                checked={value}
                onChange={(checked) => {
                  item.enable = enable;
                  return Api.saveRule(item);
                }}
              />
            </div>
          ),
        },
        {
          title: 'name',
          dataIndex: 'name',
          render: (value: string, item: InitdRule) => (
            <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
              <div>{value}</div>
            </Popover>
          ),
        },
      ]}
      pagination={false}
    />
  );
}

export default Rule;
