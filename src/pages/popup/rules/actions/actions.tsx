import { IconBranch, IconCopyAdd, IconDelete } from '@douyinfe/semi-icons';
import { Button } from '@douyinfe/semi-ui';
import Modal from '@/share/components/modal';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import { t } from '@/share/core/browser';
import { isModifyHeaderRule, isRedirectRule } from '@/share/core/utils';
import { clone, remove } from '@/share/pages/rule-utils';
import { editOnOptionsAction } from './edit-on-options';
import { quickEditAction } from './quick-edit';
import type { RuleAction } from './types';

export const actions: RuleAction[] = [
  quickEditAction,
  editOnOptionsAction,
  {
    key: 'quick-switch',
    icon: <IconBranch />,
    title: t('quick_switch'),
    onClick: () => {}, // void
    visible: (rule, placement) => {
      const isHeader = isModifyHeaderRule(rule.ruleType);
      if ((!isHeader && !isRedirectRule(rule.ruleType)) || rule.isFunction) {
        return false;
      }
      return placement === 'out';
    },
    renderOut: rule => (
      <RuleContentSwitcher
        rule={rule}
        type={rule.ruleType}
        size="small"
        add={false}
      >
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          icon={<IconBranch />}
        />
      </RuleContentSwitcher>
    ),
  },
  {
    key: 'clone',
    title: t('clone'),
    onClick: rule => clone(rule),
    icon: <IconCopyAdd />,
  },
  {
    key: 'delete',
    title: t('delete'),
    onClick: rule => {
      Modal.warning({
        title: t('delete_single_confirm', rule.name),
        onOk: () => remove(rule),
      });
    },
    type: 'danger',
    icon: <IconDelete />,
  },
];
