import { t } from '@/share/core/utils';
import { InitdRule, Rule } from '@/share/core/var';
import { IconCopyAdd, IconChevronDown, IconDelete, IconEdit, IconFavoriteList, IconMore, IconSearch, IconSend } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Card, Dropdown, Popover, Switch, Table, Tooltip } from '@douyinfe/semi-ui';
import type { ColumnProps, RowSelectionProps } from '@douyinfe/semi-ui/lib/es/table';
import { css } from '@emotion/css';
import { useResponsive } from 'ahooks';
import React from 'react';
import RuleDetail from './rule-detail';

const V_KEY = '_v_key';

interface RuleCardProps {
  name: string;
  collapsed: boolean;

  rules: Rule[];

  isEnableSelect: boolean;
  onSelect?: RowSelectionProps<Rule>['onChange'];
  selectedKeys: string[];

  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
  onCollapse: () => void;

  onRuleChangeGroup: (rule: Rule) => void;
  onRuleEnable: (rule: Rule, enable: boolean) => void;
  onRuleEdit: (rule: Rule) => void;
  onRuleClone: (rule: Rule) => void;
  onRulePreview: (rule: Rule) => void;
  onRuleDelete: (rule: Rule) => void;
}

const RuleCard = (props: RuleCardProps) => {
  const {
    name,
    collapsed,
    rules,
    isEnableSelect,
    onCollapse,
    onDelete,
    onRename,
    onRuleChangeGroup,
    onRuleClone,
    onRuleDelete,
    onRuleEdit,
    onRulePreview,
    onShare,
    onSelect,
    selectedKeys,
    onRuleEnable,
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
        <Switch size="small" checked={value} onChange={(checked) => onRuleEnable(item, checked)} />
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
                onClick: () => onRuleChangeGroup(item),
                icon: <IconFavoriteList />,
              },
              {
                node: 'item',
                name: t('clone'),
                onClick: () => onRuleClone(item),
                icon: <IconCopyAdd />,
              },
              {
                node: 'divider',
              },
              {
                node: 'item',
                name: t('delete'),
                onClick: () => onRuleDelete(item),
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
                onClick: onShare,
                icon: <IconSend />,
              },
              {
                node: 'item',
                name: t('rename'),
                onClick: onRename,
                disabled: name === t('ungrouped'),
                icon: <IconEdit />,
              },
              {
                node: 'divider',
              },
              {
                node: 'item',
                name: t('delete'),
                onClick: onDelete,
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
