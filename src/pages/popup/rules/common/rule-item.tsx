import { IconMore } from '@douyinfe/semi-icons';
import { Button, Dropdown, Popover, Switch, Tooltip } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import type { FC } from 'react';
import RuleDetail from '@/share/components/rule-detail';
import type { Rule } from '@/share/core/types';
import Api from '@/share/pages/api';
import { textEllipsis } from '@/share/pages/styles';
import { useRuleActions } from '../actions';

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
  const { showQuickPreview, outActions, menuActions } = useRuleActions(rule);

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
        {outActions.map(x =>
          x.renderOut ? (
            x.renderOut(rule)
          ) : (
            <Tooltip key={x.key} content={x.title}>
              <Button
                theme="borderless"
                type="tertiary"
                size="small"
                icon={x.icon}
                onClick={() => x.onClick(rule)}
              />
            </Tooltip>
          ),
        )}
        {menuActions.length > 0 ? (
          <Dropdown position="bottomRight" menu={menuActions}>
            <Button
              theme="borderless"
              type="tertiary"
              icon={<IconMore />}
              size="small"
            />
          </Dropdown>
        ) : null}
      </div>
    </div>
  );
};

export default RuleItem;
