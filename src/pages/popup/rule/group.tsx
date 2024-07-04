import { IconLock, IconUnlock } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import { flatten } from 'lodash-es';
import React from 'react';
import Api from '@/share/pages/api';
import useMarkCommon from '@/share/hooks/use-mark-common';
import { t } from '@/share/core/utils';

const toggleGroup = async (name: string, target: boolean) => {
  const rules = flatten(Object.values(await Api.getAllRules()));
  const toUpdate = rules.filter((x) => x.group === name);
  return Promise.all(
    toUpdate.map((x) => {
      x.enable = target;
      return Api.saveRule(x);
    }),
  );
};

const Group = () => {
  const { keys } = useMarkCommon('group');

  if (!keys || keys.length === 0) {
    return null;
  }

  return (
    <div className="item-block">
      {keys.map((key) => (
        <div className="item" key={key}>
          <div className="name">{key}</div>
          <ButtonGroup>
            <Tooltip content={t('enable')}>
              <Button theme="borderless" type="tertiary" onClick={() => toggleGroup(key, true)} size="small" icon={<IconUnlock />} />
            </Tooltip>
            <Tooltip content={t('disable')}>
              <Button theme="borderless" type="tertiary" onClick={() => toggleGroup(key, false)} size="small" icon={<IconLock />} />
            </Tooltip>
          </ButtonGroup>
        </div>
      ))}
    </div>
  );
};

export default Group;
