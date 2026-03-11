import { Spin } from '@douyinfe/semi-ui';
import { useLatest, useRequest } from 'ahooks';
import { type FC, useEffect } from 'react';
import { EVENTs, TABLE_NAMES_ARR, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Rule } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';
import RuleItem from './rule-item';

interface GroupItemProps {
  group: string;
}

const GroupItem: FC<GroupItemProps> = ({ group }) => {
  const {
    data = [],
    loading,
    refresh,
  } = useRequest(
    async () =>
      (
        await Promise.all(
          TABLE_NAMES_ARR.map(t =>
            Api.getRules(t, {
              group,
            }),
          ),
        )
      )
        .flat(1)
        .map(x => ({ ...x, [VIRTUAL_KEY]: getVirtualKey(x) })),
    {
      manual: false,
      refreshDeps: [group],
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
      {data.map(item => (
        <RuleItem key={item[VIRTUAL_KEY]} rule={item} />
      ))}
    </Spin>
  );
};

export default GroupItem;
