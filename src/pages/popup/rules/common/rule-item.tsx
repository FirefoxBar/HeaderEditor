import { IconBranch } from '@douyinfe/semi-icons';
import { Button, Popover, Switch } from '@douyinfe/semi-ui';
import { cx } from '@emotion/css';
import type { FC } from 'react';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import type { Rule } from '@/share/core/types';
import Api from '@/share/pages/api';
import { textEllipsis } from '@/share/pages/styles';
import QuickEdit from '../quick-edit';

interface RuleItemProps {
  rule: Rule;
}

const RuleItem: FC<RuleItemProps> = ({ rule }) => {
  return (
    <div className="item">
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
      <Popover
        showArrow
        position="top"
        content={<RuleDetail rule={rule} size="small" />}
        style={{ maxWidth: '300px' }}
      >
        <div className={cx(textEllipsis, 'name')}>{rule.name}</div>
      </Popover>
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
