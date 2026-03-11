import { Spin } from '@douyinfe/semi-ui';
import { useLatest, useRequest } from 'ahooks';
import { Fragment, useEffect } from 'react';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Rule, RuleWithVirtualKey } from '@/share/core/types';
import { getVirtualKey, parseVirtualKey } from '@/share/core/utils';
import useMarkCommon from '@/share/hooks/use-mark-common';
import Api from '@/share/pages/api';
import RuleItem from './rule-item';

const Rules = () => {
  const { keys } = useMarkCommon('rule');
  const { keys: groups } = useMarkCommon('group');
  const keysRef = useLatest(keys);
  const {
    data = [],
    loading,
    mutate,
  } = useRequest(
    async () => {
      const res = await Promise.all(
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
      );
      // group
      const result: Record<string, RuleWithVirtualKey[]> = {};
      res.forEach(item => {
        if ((groups || []).includes(item.group)) {
          return;
        }
        if (!result[item.group]) {
          result[item.group] = [];
        }
        result[item.group].push(item);
      });
      return result;
    },
    {
      manual: false,
      refreshDeps: [keys],
    },
  );

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const rule: Rule = request.target;
      const key = getVirtualKey(rule);
      if (keysRef.current.includes(key)) {
        mutate(currentData => {
          if (!currentData) {
            return;
          }
          const curGroup = Object.entries(currentData).find(([key, value]) =>
            value.some(x => x[VIRTUAL_KEY] === key),
          );
          if (!curGroup) {
            return currentData;
          }
          const result = { ...currentData };
          if (curGroup[0] !== rule.group) {
            result[curGroup[0]] = curGroup[1].filter(
              x => x[VIRTUAL_KEY] !== key,
            );
            result[rule.group] = [
              ...(result[rule.group] || []),
              {
                ...rule,
                [VIRTUAL_KEY]: key,
              },
            ];
          } else {
            const tempArr = [...curGroup[1]];
            const index = tempArr.findIndex(x => x[VIRTUAL_KEY] === key);
            tempArr.splice(index, 1, {
              ...rule,
              [VIRTUAL_KEY]: key,
            });
            result[rule.group] = tempArr;
          }
          return result;
        });
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
      <div className="item-block">
        {Object.entries(data).map(([group, rules]) => (
          <Fragment key={`g_${group}`}>
            <div className="title">{group}</div>
            {rules.map(item => (
              <RuleItem key={item[VIRTUAL_KEY]} rule={item} />
            ))}
          </Fragment>
        ))}
      </div>
    </Spin>
  );
};

export default Rules;
