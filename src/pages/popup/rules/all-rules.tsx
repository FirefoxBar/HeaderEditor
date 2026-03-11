import { Spin } from '@douyinfe/semi-ui';
import { useRequest } from 'ahooks';
import { flatten, groupBy } from 'lodash-es';
import { useEffect } from 'react';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { RuleWithVirtualKey } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';
import GroupItem from './common/group-item';

const AllRules = () => {
  const {
    data = {},
    loading,
    mutate,
  } = useRequest(
    async () =>
      groupBy(
        flatten(Object.values(await Api.getAllRules())).map(x => ({
          ...x,
          [VIRTUAL_KEY]: getVirtualKey(x),
        })),
        'group',
      ),
    {
      manual: false,
    },
  );

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const key = getVirtualKey(request.target);
      const rule: RuleWithVirtualKey = {
        ...request.target,
        [VIRTUAL_KEY]: key,
      };
      mutate(currentData => {
        if (!currentData) {
          return;
        }
        const oldGroup = Object.entries(currentData).find(([_, value]) =>
          value.some(x => x[VIRTUAL_KEY] === key),
        );
        const newData = { ...currentData };
        if (!oldGroup) {
          // new
          newData[rule.group] = [...(currentData[rule.group] || []), rule];
          return newData;
        }
        if (oldGroup[0] !== rule.group) {
          // group changed
          newData[oldGroup[0]] = oldGroup[1].filter(
            x => x[VIRTUAL_KEY] !== key,
          );
          newData[rule.group] = [...(currentData[rule.group] || []), rule];
          return newData;
        } else {
          // group not change
          const index = oldGroup[1].findIndex(x => x[VIRTUAL_KEY] === key);
          newData[oldGroup[0]] = [...oldGroup[1]];
          newData[oldGroup[0]][index] = rule;
          return newData;
        }
      });
    };

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
    };
  }, []);

  return (
    <Spin spinning={loading}>
      <div className="main-list">
        {Object.entries(data).map(([group, rules]) => (
          <GroupItem key={group} group={group} rules={rules} hasToggle />
        ))}
      </div>
    </Spin>
  );
};

export default AllRules;
