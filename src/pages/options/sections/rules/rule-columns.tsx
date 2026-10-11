import {
  IconBranch,
  IconCopyAdd,
  IconDelete,
  IconEdit,
  IconFavoriteList,
  IconMore,
  IconSearch,
  IconStar,
} from '@douyinfe/semi-icons';
import {
  Button,
  ButtonGroup,
  Dropdown,
  Popover,
  Switch,
  Tooltip,
} from '@douyinfe/semi-ui';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { css } from '@emotion/css';
import { useResponsive } from 'ahooks';
import { selectGroup } from '@/pages/options/utils';
import Modal from '@/share/components/modal';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import { t } from '@/share/core/browser';
import { VIRTUAL_KEY } from '@/share/core/constant';
import type { RuleWithVirtualKey } from '@/share/core/types';
import useMarkCommon from '@/share/hooks/use-mark-common';
import usePref from '@/share/hooks/use-pref';
import Api from '@/share/pages/api';
import { clone } from '@/share/pages/rule-utils';
import { textEllipsis } from '@/share/pages/styles';
import { remove, toggleRule } from './utils';

interface RuleColumnsOptions {
  onRuleEdit: (rule: RuleWithVirtualKey) => void;
  onRulePreview: (rule: RuleWithVirtualKey) => void;
  /**
   * 是否展示「规则类型」列。
   * 不传时按视口宽度自适应（列表页）；结果面板等窄容器可显式传 false。
   */
  showRuleType?: boolean;
}

/**
 * 规则表格列定义，列表页与筛选结果共用
 */
export function useRuleColumns({
  onRuleEdit,
  onRulePreview,
  showRuleType,
}: RuleColumnsOptions): Array<ColumnProps<RuleWithVirtualKey>> {
  const responsive = useResponsive();
  const {
    keys: commonRuleKeys,
    add: addCommonRule,
    remove: removeCommonRule,
  } = useMarkCommon('rule');

  const [pref] = usePref('show-quick-preview');
  const showQuickPreview = pref.includes('manage');

  const columns: Array<ColumnProps<RuleWithVirtualKey>> = [
    {
      title: t('enable'),
      className: 'cell-enable',
      dataIndex: 'enable',
      align: 'center',
      width: 80,
      render: (value: boolean, item) => (
        <div
          className={css`
            display: flex;
            align-items: center;
          `}
        >
          <Switch
            size="small"
            checked={value}
            onChange={checked => toggleRule(item, checked)}
          />
        </div>
      ),
    },
    {
      title: t('name'),
      className: 'cell-name',
      dataIndex: 'name',
      render: (value: string, item) =>
        showQuickPreview ? (
          <Popover
            showArrow
            position="top"
            content={<RuleDetail rule={item} />}
            style={{ maxWidth: '300px' }}
            autoAdjustOverflow
          >
            <div className={textEllipsis}>{value}</div>
          </Popover>
        ) : (
          <div className={textEllipsis}>{value}</div>
        ),
    },
    {
      title: t('ruleType'),
      className: 'cell-type',
      dataIndex: 'ruleType',
      width: 200,
      render: (value: string) => t(`rule_${value}`),
    },
    {
      title: t('action'),
      className: 'cell-action',
      dataIndex: 'action',
      width: 160,
      render: (_value, item) => {
        const isMarked = commonRuleKeys.includes(item[VIRTUAL_KEY]);
        return (
          <ButtonGroup>
            <Tooltip content={t('edit')}>
              <Button
                theme="borderless"
                type="tertiary"
                onClick={() => onRuleEdit(item)}
                icon={<IconEdit />}
              />
            </Tooltip>
            <Tooltip content={t('view')}>
              <Button
                theme="borderless"
                type="tertiary"
                onClick={() => onRulePreview(item)}
                icon={<IconSearch />}
              />
            </Tooltip>
            <RuleContentSwitcher rule={item} type={item.ruleType} add>
              <Button
                theme="borderless"
                type="tertiary"
                icon={<IconBranch />}
              />
            </RuleContentSwitcher>
            <Dropdown
              position="bottomRight"
              menu={[
                {
                  node: 'item',
                  name: t(isMarked ? 'common_unmark' : 'common_mark'),
                  onClick: () => {
                    if (isMarked) {
                      removeCommonRule(item[VIRTUAL_KEY]);
                    } else {
                      addCommonRule(item[VIRTUAL_KEY]);
                    }
                  },
                  icon: (
                    <IconStar
                      style={
                        isMarked ? { color: 'rgb(var(--semi-amber-5))' } : {}
                      }
                    />
                  ),
                },
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
                  onClick: () => clone(item),
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
                      title: t('delete_single_confirm', item.name),
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
        );
      },
    },
  ];

  // 未显式指定时，按视口宽度自适应
  if (typeof showRuleType === 'undefined' ? !responsive.lg : !showRuleType) {
    const index = columns.findIndex(x => x.dataIndex === 'ruleType');
    columns.splice(index, 1);
  }

  return columns;
}

export default useRuleColumns;
