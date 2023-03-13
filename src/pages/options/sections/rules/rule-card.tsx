import Icon from '@/share/components/icon';
import { t } from '@/share/core/utils';
import { InitdRule, Rule } from '@/share/core/var';
import { IconChevronDown, IconMore, IconSend } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Card, Dropdown, Popover, Space, Switch, Table, Tooltip } from '@douyinfe/semi-ui';
import type { RowSelectionProps } from '@douyinfe/semi-ui/lib/es/table';
import { css, cx } from '@emotion/css';
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

  const rowSelection = isEnableSelect ? {
    onChange: onSelect,
    selectedRowKeys: selectedKeys,
  } : undefined;

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
        <ButtonGroup
          className={cx(css`
          display: flex;
          flex-direction: row;

          .collapse-icon {
            display: inline-block;
            transition: all .2s ease;
            transform: rotateZ(180deg);
          }
        `, !collapsed ? css`
            .collapse-icon {
            transform: rotateZ(0deg);
          }
        ` : '')}
        >
          {name !== t('ungrouped') && (
          <Tooltip content={t('rename')}>
            <Button type="tertiary" theme="borderless" onClick={onRename} icon={<i className="iconfont icon-edit" />} />
          </Tooltip>
          )}
          <Tooltip content={t('share')}>
            <Button type="tertiary" theme="borderless" onClick={onShare} icon={<IconSend />} />
          </Tooltip>
          {name !== t('ungrouped') && (
          <Tooltip content={t('delete')}>
            <Button type="tertiary" theme="borderless" onClick={onDelete} icon={<i className="iconfont icon-delete" />} />
          </Tooltip>
          )}
          <Button theme="borderless" icon={<IconChevronDown className="collapse-icon" />} type="tertiary" onClick={onCollapse} />
        </ButtonGroup>
    }
    >
      <Table
        rowKey={V_KEY}
        dataSource={rules}
        size="small"
        pagination={false}
        rowSelection={rowSelection}
        columns={[
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
                <span>{value}</span>
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
                  <Button theme="borderless" type="tertiary" onClick={() => onRuleEdit(item)} icon={<Icon type="edit" />} />
                </Tooltip>
                <Tooltip content={t('view')}>
                  <Button theme="borderless" type="tertiary" onClick={() => onRulePreview(item)} icon={<Icon type="search" />} />
                </Tooltip>
                <Dropdown
                  position="bottomRight"
                  menu={[
                    {
                      node: 'item',
                      name: t('group'),
                      onClick: () => onRuleChangeGroup(item),
                      icon: <Icon type="playlist-add" />,
                    },
                    {
                      node: 'item',
                      name: t('clone'),
                      onClick: () => onRuleClone(item),
                      icon: <Icon type="content-copy" />,
                    },
                    {
                      node: 'divider',
                    },
                    {
                      node: 'item',
                      name: t('delete'),
                      onClick: () => onRuleDelete(item),
                      type: 'danger',
                      icon: <Icon type="delete" />,
                    },
                  ]}
                >
                  <Button theme="borderless" type="tertiary" icon={<IconMore />} />
                </Dropdown>
              </ButtonGroup>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default RuleCard;
