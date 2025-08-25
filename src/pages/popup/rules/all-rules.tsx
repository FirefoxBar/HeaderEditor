import { IconBranch } from '@douyinfe/semi-icons';
import { Button, Popover, Spin, Switch } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import { useRequest } from 'ahooks';
import { flatten } from 'lodash-es';
import { Fragment, useEffect } from 'react';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import { EVENTs, VIRTUAL_KEY } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Rule } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { textEllipsis } from '@/share/pages/styles';
import QuickEdit from './quick-edit';

const titleStyle = css`
  font-size: 12px;
  font-weight: 500;
  line-height: 24px;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const AllRules = () => {
  const {
    data = [],
    loading,
    mutate,
  } = useRequest(
    async () => {
      const res = await Api.getAllRules();
      return flatten(Object.values(res))
        .sort((a, b) => a.group.localeCompare(b.group))
        .map(x => ({ ...x, [VIRTUAL_KEY]: getVirtualKey(x) }));
    },
    {
      manual: false,
    },
  );

  useEffect(() => {
    const handleRuleUpdate = (request: any) => {
      const rule: Rule = request.target;
      const key = getVirtualKey(rule);
      mutate(currentData => {
        if (!currentData) {
          return;
        }
        const index = currentData.findIndex(x => x[VIRTUAL_KEY] === key);
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
    };

    notify.event.on(EVENTs.RULE_UPDATE, handleRuleUpdate);

    return () => {
      notify.event.off(EVENTs.RULE_UPDATE, handleRuleUpdate);
    };
  }, []);

  if (data.length === 0 && !loading) {
    return null;
  }

  const renderedGroup = new Set<string>();

  return (
    <Spin spinning={loading}>
      <div className="item-block">
        {data.map(item => {
          const itemDOM = (
            <div className="item" key={item[VIRTUAL_KEY]}>
              <Switch
                size="small"
                checked={item.enable}
                onChange={checked =>
                  Api.saveRule({
                    ...item,
                    enable: checked,
                  })
                }
              />
              <Popover
                showArrow
                position="top"
                content={<RuleDetail rule={item} size="small" />}
                style={{ maxWidth: '300px' }}
              >
                <div className={cx(textEllipsis, 'name')}>{item.name}</div>
              </Popover>
              <div className="actions">
                <QuickEdit rule={item} />
                <RuleContentSwitcher
                  rule={item}
                  type={item.ruleType}
                  size="small"
                  add={false}
                >
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={<IconBranch />}
                  />
                </RuleContentSwitcher>
              </div>
            </div>
          );

          if (renderedGroup.has(item.group)) {
            return itemDOM;
          }
          return (
            <Fragment key={item.group}>
              <div className={titleStyle}>{item.group}</div>
              {itemDOM}
            </Fragment>
          );
        })}
      </div>
    </Spin>
  );
};

export default AllRules;
