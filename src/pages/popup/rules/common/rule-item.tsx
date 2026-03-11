import { IconBranch } from '@douyinfe/semi-icons';
import { Button, Popover, Switch } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import type { FC } from 'react';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import type { Rule } from '@/share/core/types';
import usePref from '@/share/hooks/use-pref';
import Api from '@/share/pages/api';
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
      </div>
    </div>
  );
};

export default RuleItem;
