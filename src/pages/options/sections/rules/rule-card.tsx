import Api from '@/share/core/api';
import file from '@/share/core/file';
import { getTableName, t } from '@/share/core/utils';
import { InitdRule, Rule, TABLE_NAMES } from '@/share/core/var';
import { convertToTinyRule, createExport } from '@/share/core/ruleUtils';
import { selectGroup, getExportName } from '@/pages/options/utils';
import { IconCopyAdd, IconChevronDown, IconDelete, IconEdit, IconFavoriteList, IconMore, IconSearch, IconSend } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Card, Dropdown, Popover, Switch, Table, Tooltip } from '@douyinfe/semi-ui';
import type { ColumnProps, RowSelectionProps } from '@douyinfe/semi-ui/lib/es/table';
import { css } from '@emotion/css';
import { useResponsive } from 'ahooks';
import React from 'react';
import RuleDetail from './rule-detail';
import { batchShare, remove, toggleRule } from './utils';

const V_KEY = '_v_key';

interface RuleCardProps {
  name: string;
  collapsed: boolean;

  rules: Rule[];

  isEnableSelect: boolean;
  onSelect?: RowSelectionProps<Rule>['onChange'];
  selectedKeys: string[];

  onCollapse: () => void;

  onRuleEdit: (rule: Rule) => void;
  onRulePreview: (rule: Rule) => void;
}

const RuleCard = (props: RuleCardProps) => {
  const {
    name,
    collapsed,
    rules,
    isEnableSelect,
    onCollapse,
    onRuleEdit,
    onRulePreview,
    onSelect,
    selectedKeys,
  } = props;

  const responsive = useResponsive();

  const rowSelection = isEnableSelect ? {
    onChange: onSelect,
    selectedRowKeys: selectedKeys,
  } : undefined;

  const tableColumns: Array<ColumnProps<Rule>> = [
    {
      title: t('enable'),
      className: 'cell-enable',
      dataIndex: 'enable',
      align: 'center',
      width: 80,
      render: (value: boolean, item: InitdRule) => (
        <Switch size="small" checked={value} onChange={(checked) => toggleRule(item, checked)} />
      ),
    },
    {
      title: t('name'),
      className: 'cell-name',
      dataIndex: 'name',
      render: (value: string, item: InitdRule) => (
        <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
          <div>{value}</div>
        </Popover>
      ),
    },
    {
      title: t('ruleType'),
      className: 'cell-type',
      dataIndex: 'ruleType',
      width: 180,
      render: (value: string) => t(`rule_${value}`),
    },
    {
      title: t('action'),
      className: 'cell-action',
      dataIndex: 'action',
      width: 128,
      render: (v, item: InitdRule) => (
        <ButtonGroup>
          <Tooltip content={t('edit')}>
            <Button theme="borderless" type="tertiary" onClick={() => onRuleEdit(item)} icon={<IconEdit />} />
          </Tooltip>
          <Tooltip content={t('view')}>
            <Button theme="borderless" type="tertiary" onClick={() => onRulePreview(item)} icon={<IconSearch />} />
          </Tooltip>
          <Dropdown
            position="bottomRight"
            menu={[
              {
                node: 'item',
                name: t('group'),
                onClick: async () => {
                  const newGroup = await selectGroup(item.group);
                  const oldGroup = item.group;
                  if (oldGroup === newGroup) {
                    return;
                  }
                  item.group = newGroup;
                  return Api.saveRule(item);
                },
                icon: <IconFavoriteList />,
              },
              {
                node: 'item',
                name: t('clone'),
                onClick: () => {
                  const newItem = convertToTinyRule(item);
                  newItem.name += '_clone';
                  Api.saveRule(newItem);
                },
                icon: <IconCopyAdd />,
              },
              {
                node: 'divider',
              },
              {
                node: 'item',
                name: t('delete'),
                onClick: () => {
                  Modal.warning({
                    title: t('delete_confirm'),
                    onOk: () => remove(item),
                  });
                },
                type: 'danger',
                icon: <IconDelete />,
              },
            ]}
          >
            <Button theme="borderless" type="tertiary" icon={<IconMore />} />
          </Dropdown>
        </ButtonGroup>
      ),
    },
  ];

  if (!responsive.lg) {
    const index = tableColumns.findIndex((x) => x.dataIndex === 'ruleType');
    tableColumns.splice(index, 1);
  }

  return (
    <Card
      className={css`
      margin-bottom: 12px;

      .semi-card-header {
        padding: 12px;
      }

      .semi-card-header-wrapper {
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
      }

      .semi-card-body {
        padding: 0;
        display: ${!collapsed ? 'none' : 'block'}
      }
    `}
      key={name}
      title={name}
      headerExtraContent={
        <ButtonGroup>
          <Dropdown
            position="bottomRight"
            menu={[
              {
                node: 'item',
                name: t('share'),
                onClick: () => {
                  const result: any = {};
                  TABLE_NAMES.forEach((tb) => {
                    result[tb] = [];
                  });
                  rules.forEach((e) => result[getTableName(e.ruleType)].push(e));
                  file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
                },
                icon: <IconSend />,
              },
              {
                node: 'item',
                name: t('rename'),
                onClick: () => {
                  const newGroup = await selectGroup(name);
                  if (name === newGroup) {
                    return;
                  }
                  // 更新规则
                  for (const item of rules) {
                    item.group = newGroup;
                    await Api.saveRule(item);
                  }
                },
                disabled: name === t('ungrouped'),
                icon: <IconEdit />,
              },
              {
                node: 'divider',
              },
              {
                node: 'item',
                name: t('delete'),
                onClick: () => {
                  Modal.confirm({
                    title: t('delete_confirm'),
                    onOk: () => Promise.all(rules.map((item) => remove(item))),
                  });
                },
                type: 'danger',
                disabled: name === t('ungrouped'),
                icon: <IconDelete />,
              },
            ]}
          >
            <Button theme="borderless" type="tertiary" icon={<IconMore />} />
          </Dropdown>
          <Button
            theme="borderless"
            icon={
              <IconChevronDown
                style={{
                  transform: collapsed ? 'rotateZ(180deg)' : 'rotateZ(0deg)',
                }}
                className={css`
                  display: inline-block;
                  transition: all .2s ease;
                `}
              />
            }
            type="tertiary"
            onClick={onCollapse}
          />
        </ButtonGroup>
    }
    >
      <Table
        rowKey={V_KEY}
        dataSource={rules}
        size="small"
        pagination={false}
        rowSelection={rowSelection}
        columns={tableColumns}
      />
    </Card>
  );
};

export default RuleCard;
