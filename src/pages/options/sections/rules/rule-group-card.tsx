import {
  IconChevronDown,
  IconDelete,
  IconEdit,
  IconLock,
  IconMore,
  IconSend,
  IconStar,
  IconUnlock,
} from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Card, Dropdown, Table } from '@douyinfe/semi-ui';
import type { RowSelectionProps } from '@douyinfe/semi-ui/lib/es/table';
import { css } from '@emotion/css';
import { memo } from 'react';
import { getExportName, selectGroup } from '@/pages/options/utils';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';
import { VIRTUAL_KEY } from '@/share/core/constant';
import type { RuleWithVirtualKey } from '@/share/core/types';
import useMarkCommon from '@/share/hooks/use-mark-common';
import Api from '@/share/pages/api';
import { save as saveFile } from '@/share/pages/file';
import { useRuleColumns } from './rule-columns';
import { createShareJson, remove, toggleRule } from './utils';

interface RuleCardProps {
  name: string;
  expanded: boolean;

  rules: RuleWithVirtualKey[];

  isEnableSelect: boolean;
  onSelect?: RowSelectionProps<RuleWithVirtualKey>['onChange'];
  selectedKeys: string[];

  onCollapse: (name: string) => void;

  onRuleEdit: (rule: RuleWithVirtualKey) => void;
  onRulePreview: (rule: RuleWithVirtualKey) => void;
}

const RuleGroupCard = (props: RuleCardProps) => {
  const {
    name,
    expanded,
    rules,
    isEnableSelect,
    onCollapse,
    onRuleEdit,
    onRulePreview,
    onSelect,
    selectedKeys,
  } = props;

  const {
    keys: commonGroup,
    add: addCommonGroup,
    remove: removeCommonGroup,
  } = useMarkCommon('group');
  const isGroupMarked = commonGroup.includes(name);

  const rowSelection = isEnableSelect
    ? {
        onChange: onSelect,
        selectedRowKeys: selectedKeys,
      }
    : undefined;

  const tableColumns = useRuleColumns({ onRuleEdit, onRulePreview });

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
        display: ${expanded ? 'block' : 'none'}
      }

      .switch-container {
        display: flex;
        align-items: center;
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
                name: t(isGroupMarked ? 'common_unmark' : 'common_mark'),
                onClick: () => {
                  if (isGroupMarked) {
                    removeCommonGroup(name);
                  } else {
                    addCommonGroup(name);
                  }
                },
                icon: (
                  <IconStar
                    style={
                      isGroupMarked ? { color: 'rgb(var(--semi-amber-5))' } : {}
                    }
                  />
                ),
              },
              {
                node: 'item',
                name: t('share'),
                onClick: () => {
                  saveFile(createShareJson(rules), getExportName());
                },
                icon: <IconSend />,
              },
              {
                node: 'item',
                name: t('enable'),
                onClick: () => rules.forEach(item => toggleRule(item, true)),
                icon: <IconUnlock />,
              },
              {
                node: 'item',
                name: t('disable'),
                onClick: () => rules.forEach(item => toggleRule(item, false)),
                icon: <IconLock />,
              },
              {
                node: 'item',
                name: t('rename'),
                onClick: async () => {
                  const newGroup = await selectGroup(name);
                  if (name === newGroup) {
                    return;
                  }
                  // 更新规则
                  return Promise.all(
                    rules.map(item =>
                      Api.saveRule({ ...item, group: newGroup }),
                    ),
                  );
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
                    onOk: () => Promise.all(rules.map(item => remove(item))),
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
                  transform: expanded ? 'rotateZ(180deg)' : 'rotateZ(0deg)',
                }}
                className={css`
                  display: inline-block;
                  transition: all .2s ease;
                `}
              />
            }
            type="tertiary"
            onClick={() => onCollapse(name)}
          />
        </ButtonGroup>
      }
    >
      <Table
        rowKey={VIRTUAL_KEY}
        dataSource={rules}
        size="small"
        pagination={false}
        rowSelection={rowSelection}
        columns={tableColumns}
        style={{ tableLayout: 'fixed' }}
      />
    </Card>
  );
};

export default memo(RuleGroupCard);
