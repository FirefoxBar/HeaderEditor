import { Spin } from '@douyinfe/semi-ui';
import { useLatest, useRequest } from 'ahooks';
import { flatten } from 'lodash-es';
import { type FC, useEffect } from 'react';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import { getRuleSortOrder, sortRules } from '@/share/core/sort';
import type { Rule } from '@/share/core/types';
import { getVirtualKey, isValidArray } from '@/share/core/utils';
import useGroupOrder from '@/share/hooks/use-group-order';
import useMarkCommon from '@/share/hooks/use-mark-common';
import Api from '@/share/pages/api';
import GroupItem from './group-item';

interface GroupLoaderProps {
  group: string;
}

const GroupLoader: FC<GroupLoaderProps> = ({ group }) => {
  const {
    data = [],
    loading,
    refresh,
  } = useRequest(
    async () => {
      const [order, allRules] = await Promise.all([
        getRuleSortOrder(),
        Api.getAllRules(),
      ]);
      const rules = flatten(Object.values(allRules))
        .filter(x => x.group === group)
        .map(x => ({
          ...x,
          [VIRTUAL_KEY]: getVirtualKey(x),
        }));
      return sortRules(rules, order);
    },
    {
      manual: false,
      refreshDeps: [group],
      debounceWait: 100,
    },
  );

  const dataRef = useLatest(data);

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const rule: Rule = request.target;
      const key = getVirtualKey(rule);
      if (dataRef.current.some(x => getVirtualKey(x) === key)) {
        refresh();
      }
    };

    const handleRuleDelete = (request: any) => {
      const { id, table } = request;
      const key = `${table}-${id}`;
      if (dataRef.current.some(x => getVirtualKey(x) === key)) {
        refresh();
      }
    };

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);
    notify.event.on(EVENTs.RULE_DELETE, handleRuleDelete);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
      notify.event.off(EVENTs.RULE_DELETE, handleRuleDelete);
    };
  }, []);

  if (Object.keys(data).length === 0 && !loading) {
    return null;
  }

  return (
    <Spin spinning={loading}>
      <GroupItem group={group} rules={data} hasToggle />
    </Spin>
  );
};

const Group = () => {
  const { keys } = useMarkCommon('group');
  const { orderedNames } = useGroupOrder(isValidArray(keys) ? keys : []);

  if (!isValidArray(keys)) {
    return null;
  }

  return (
    <div className="item-block">
      {orderedNames.map(key => (
        <GroupLoader key={key} group={key} />
      ))}
    </div>
  );
};

export default Group;
