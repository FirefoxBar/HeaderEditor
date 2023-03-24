import { IconLock, IconUnlock } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Table, Tooltip } from '@douyinfe/semi-ui';
import { flatten } from 'lodash-es';
import React, { useMemo } from 'react';
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

  const tableData = useMemo(() => keys.map((x) => ({
    name: x,
  })), [keys]);

  if (!keys || keys.length === 0) {
    return null;
  }

  return (
    <Table
      rowKey="name"
      dataSource={tableData}
      showHeader={false}
      size="small"
      columns={[
        {
          title: 'name',
          dataIndex: 'name',
        },
        {
          title: 'action',
          dataIndex: 'name',
          className: 'cell-action',
          width: 96,
          render: (value: string) => (
            <ButtonGroup>
              <Tooltip content={t('enable')}>
                <Button theme="borderless" type="tertiary" onClick={() => toggleGroup(value, true)} icon={<IconUnlock />} />
              </Tooltip>
              <Tooltip content={t('disable')}>
                <Button theme="borderless" type="tertiary" onClick={() => toggleGroup(value, false)} icon={<IconLock />} />
              </Tooltip>
            </ButtonGroup>
          ),
        },
      ]}
      pagination={false}
    />
  );
};

export default Group;
