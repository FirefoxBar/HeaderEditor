import {
  IconBranch,
  IconCopyAdd,
  IconDelete,
  IconMore,
  IconRoute,
} from '@douyinfe/semi-icons';
import { Button, Dropdown, Popover, Switch, Tooltip } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import type { FC } from 'react';
import browser from 'webextension-polyfill';
import Modal from '@/share/components/modal';
import RuleContentSwitcher from '@/share/components/rule-content-switcher';
import RuleDetail from '@/share/components/rule-detail';
import { t } from '@/share/core/browser';
import { convertToBasicRule } from '@/share/core/rule-utils';
import type { Rule } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
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
        <Tooltip content={t('edit')}>
          <Button
            theme="borderless"
            type="tertiary"
            size="small"
            icon={<IconRoute />}
            onClick={async () => {
              const table = getTableName(rule.ruleType);
              const ruleId = String(rule.id);
              const optionsUrl = browser.runtime.getURL('options.html');

              const targetUrl = new URL(optionsUrl);
              targetUrl.searchParams.set('table', table);
              targetUrl.searchParams.set('ruleId', ruleId);
              targetUrl.searchParams.set('edit', '1');

              const tabs = await browser.tabs.query({});

              // 查找相同规则对应的设置页
              const matchingTabs = tabs.filter(tab => {
                if (!tab.url || tab.id === undefined) {
                  return false;
                }

                try {
                  const currentUrl = new URL(tab.url);

                  return (
                    currentUrl.origin === targetUrl.origin &&
                    currentUrl.pathname === targetUrl.pathname &&
                    currentUrl.searchParams.get('table') === table &&
                    currentUrl.searchParams.get('ruleId') === ruleId
                  );
                } catch {
                  return false;
                }
              });

              // 优先选择编辑窗口已经打开的设置页
              const existingTab =
                matchingTabs.find(tab => {
                  const url = new URL(tab.url!);
                  return url.searchParams.get('edit') === '1';
                }) ?? matchingTabs[0];

              if (existingTab?.id !== undefined) {
                if (existingTab.windowId !== undefined) {
                  await browser.windows.update(existingTab.windowId, {
                    focused: true,
                  });
                }

                if (existingTab.url) {
                  const currentUrl = new URL(existingTab.url);

                  // 编辑窗口已经打开，只切换标签页
                  if (currentUrl.searchParams.get('edit') === '1') {
                    await browser.tabs.update(existingTab.id, {
                      active: true,
                    });
                    return;
                  }
                }

                // 编辑窗口已经关闭，重新加载并打开对应规则
                await browser.tabs.update(existingTab.id, {
                  url: targetUrl.toString(),
                  active: true,
                });
                return;
              }

              // 不存在对应规则的设置页，创建新标签页
              await browser.tabs.create({
                url: targetUrl.toString(),
                active: true,
              });
            }}
          />
        </Tooltip>
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
