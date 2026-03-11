import { IconLock, IconUnlock } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import { cx } from '@emotion/css';
import { flatten } from 'lodash-es';
import type { FC } from 'react';
import { VIRTUAL_KEY } from '@/share/core/constant';
import type { RuleWithVirtualKey } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';
import RuleItem from './rule-item';

const toggleGroup = async (name: string, target: boolean) => {
  const rules = flatten(Object.values(await Api.getAllRules()));
  const toUpdate = rules.filter(x => x.group === name);
  try {
    await Promise.all(
      toUpdate.map(x => {
        x.enable = target;
        return Api.saveRule(x);
      }),
    );
    Toast().success(t('switch_success'));
  } catch (e) {
    console.error(e);
    Toast().error((e as Error).message);
  }
};

interface GroupItemProps {
  group: string;
  rules: RuleWithVirtualKey[];
  hasToggle?: boolean;
}

const GroupItem: FC<GroupItemProps> = ({ group, rules, hasToggle = true }) => {
  if (group.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cx('group-title', { toggle: hasToggle })}>
        <div className="name">{group}</div>
        {hasToggle && (
          <ButtonGroup>
            <Tooltip content={t('enable')}>
              <Button
                theme="borderless"
                type="tertiary"
                onClick={() => toggleGroup(group, true)}
                size="small"
                icon={<IconUnlock />}
              />
            </Tooltip>
            <Tooltip content={t('disable')}>
              <Button
                theme="borderless"
                type="tertiary"
                onClick={() => toggleGroup(group, false)}
                size="small"
                icon={<IconLock />}
              />
            </Tooltip>
          </ButtonGroup>
        )}
      </div>
      {rules.map(item => (
        <RuleItem key={item[VIRTUAL_KEY]} rule={item} />
      ))}
    </>
  );
};

export default GroupItem;
