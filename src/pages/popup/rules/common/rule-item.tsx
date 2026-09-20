import {
  IconBranch,
  IconCopyAdd,
  IconDelete,
  IconMore,
} from '@douyinfe/semi-icons';
import { Button, Dropdown, Popover, Switch } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import type { FC } from 'react';
import Modal from '@/share/components/modal';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import { t } from '@/share/core/browser';
import { convertToBasicRule } from '@/share/core/rule-utils';
import type { Rule } from '@/share/core/types';
import usePref from '@/share/hooks/use-pref';
import Api from '@/share/pages/api';
import { clone, remove } from '@/share/pages/rule-utils';
import { textEllipsis } from '@/share/pages/styles';
import QuickEdit from '../quick-edit';

interface RuleItemProps {
  rule: Rule;
}

const style = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  background-color: var(--semi-color-bg-1);
  border-top: 1px solid var(--semi-color-border);
  padding-left: 8px;
  padding-right: 8px;

  > * {
    flex-grow: 0;
    flex-shrink: 0;
  }

  > .name {
    flex-grow: 1;
    flex-shrink: 1;
    font-size: 14px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;

const RuleItem: FC<RuleItemProps> = ({ rule }) => {
  const [pref] = usePref('show-quick-preview');
  const showQuickPreview = pref.includes('popup');

  const title = showQuickPreview ? (
    <Popover
      showArrow
      position="top"
      content={<RuleDetail rule={rule} size="small" />}
      style={{ maxWidth: '300px' }}
      autoAdjustOverflow
    >
      <div className={cx(textEllipsis, 'name')}>{rule.name}</div>
    </Popover>
  ) : (
    <div className={cx(textEllipsis, 'name')}>{rule.name}</div>
  );

  return (
    <div className={style}>
      <Switch
        size="small"
        checked={rule.enable}
        onChange={checked =>
          Api.saveRule({
            ...rule,
            enable: checked,
          })
        }
      />
      {title}
      <div className="actions">
        <QuickEdit rule={rule} />
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

        <Dropdown
          position="bottomRight"
          menu={[
            {
              node: 'item',
              name: t('clone'),
              onClick: () => clone(rule),
              icon: <IconCopyAdd />,
            },
            {
              node: 'item',
              name: t('delete'),
              onClick: () => {
                Modal.warning({
                  title: t('delete_single_confirm', rule.name),
                  onOk: () => remove(rule),
                });
              },
              type: 'danger',
              icon: <IconDelete />,
            },
          ]}
        >
          <Button
            theme="borderless"
            type="tertiary"
            icon={<IconMore />}
            size="small"
          />
        </Dropdown>
      </div>
    </div>
  );
};

export default RuleItem;
