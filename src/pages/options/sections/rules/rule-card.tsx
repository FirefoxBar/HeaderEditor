import Icon from '@/share/components/icon';
import { t } from '@/share/core/utils';
import { InitdRule, Rule } from '@/share/core/var';
import { IconChevronDown, IconSend } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Card, Popover, Space, Switch, Table, Tooltip } from '@douyinfe/semi-ui';
import { RowSelectionProps, TableProps } from '@douyinfe/semi-ui/lib/es/table';
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
    onRename, onRuleChangeGroup, onRuleClone, onRuleDelete, onRuleEdit, onRulePreview, onShare, onSelect, selectedKeys, onRuleEnable } = props;

  const rowSelection = isEnableSelect ? {
    onChange: onSelect,
    selectedRowKeys: selectedKeys,
  } : undefined;

  return (
    <Card
      className={css`
      margin-bottom: 12px;

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
            render: (value: string) => t(`rule_${value}`),
          },
          {
            title: t('action'),
            className: 'cell-action',
            dataIndex: 'action',
            render: (v, item: InitdRule) => (
              <Space>
                <Button type="secondary" onClick={() => onRuleChangeGroup(item)}>
                  <Icon type="playlist-add" />
                  {t('group')}
                </Button>
                <Button type="secondary" onClick={() => onRuleEdit(item)}>
                  <Icon type="edit" />
                  {t('edit')}
                </Button>
                <Button type="secondary" onClick={() => onRuleClone(item)}>
                  <Icon type="content-copy" />
                  {t('clone')}
                </Button>
                <Button type="secondary" onClick={() => onRulePreview(item)}>
                  <Icon type="search" />
                  {t('view')}
                </Button>
                <Button type="secondary" onClick={() => onRuleDelete(item)}>
                  <Icon type="delete" />
                  {t('delete')}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default RuleCard;
