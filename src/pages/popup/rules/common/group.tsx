import { IconLock, IconUnlock } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Tooltip } from '@douyinfe/semi-ui';
import { flatten } from 'lodash-es';
import { Fragment } from 'react';
import { isValidArray, t } from '@/share/core/utils';
import useMarkCommon from '@/share/hooks/use-mark-common';
import Api from '@/share/pages/api';
import { Toast } from '@/share/pages/toast';
import GroupItem from './group-item';

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

const Group = () => {
  const { keys } = useMarkCommon('group');

  if (!isValidArray(keys)) {
    return null;
  }

  return (
    <div className="item-block">
      {keys.map(key => (
        <Fragment key={key}>
          <div className="title group">
            <div className="name">{key}</div>
            <ButtonGroup>
              <Tooltip content={t('enable')}>
                <Button
                  theme="borderless"
                  type="tertiary"
                  onClick={() => toggleGroup(key, true)}
                  size="small"
                  icon={<IconUnlock />}
                />
              </Tooltip>
              <Tooltip content={t('disable')}>
                <Button
                  theme="borderless"
                  type="tertiary"
                  onClick={() => toggleGroup(key, false)}
                  size="small"
                  icon={<IconLock />}
                />
              </Tooltip>
            </ButtonGroup>
          </div>
          <GroupItem group={key} />
        </Fragment>
      ))}
    </div>
  );
};

export default Group;
