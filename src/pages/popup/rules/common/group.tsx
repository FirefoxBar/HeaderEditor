import { Spin } from '@douyinfe/semi-ui';
import { useLatest, useRequest } from 'ahooks';
import { flatten } from 'lodash-es';
import { type FC, useEffect } from 'react';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Rule } from '@/share/core/types';
import { getVirtualKey, isValidArray } from '@/share/core/utils';
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
    async () =>
      flatten(Object.values(await Api.getAllRules()))
        .filter(x => x.group === group)
        .map(x => ({
          ...x,
          [VIRTUAL_KEY]: getVirtualKey(x),
        })),
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

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
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

  if (!isValidArray(keys)) {
    return null;
  }

  return (
    <div className="item-block">
      {keys.map(key => (
        <GroupLoader key={key} group={key} />
      ))}
    </div>
  );
};

export default Group;
