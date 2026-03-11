import { Spin } from '@douyinfe/semi-ui';
import { useLatest, useRequest } from 'ahooks';
import { groupBy } from 'lodash-es';
import { useEffect } from 'react';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Rule } from '@/share/core/types';
import { getVirtualKey, parseVirtualKey } from '@/share/core/utils';
import useMarkCommon from '@/share/hooks/use-mark-common';
import Api from '@/share/pages/api';
import GroupItem from './group-item';

const Rules = () => {
  const { keys } = useMarkCommon('rule');
  const { keys: groups } = useMarkCommon('group');
  const keysRef = useLatest(keys);
  const {
    data = [],
    loading,
    refresh,
  } = useRequest(
    async () =>
      groupBy(
        (
          await Promise.all(
            keys.map(async key => {
              const item = parseVirtualKey(key);
              const result = await Api.getRules(item.table, {
                id: item.id,
              });
              return {
                ...result[0],
                [VIRTUAL_KEY]: key,
              };
            }),
          )
        ).filter(x => !(groups || []).includes(x.group)),
        'group',
      ),
    {
      manual: false,
      refreshDeps: [keys],
      debounceWait: 100,
    },
  );

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const rule: Rule = request.target;
      const key = getVirtualKey(rule);
      if (keysRef.current.includes(key)) {
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
      {Object.entries(data).map(([group, rules]) => (
        <GroupItem key={group} group={group} rules={rules} />
      ))}
    </Spin>
  );
};

export default Rules;
