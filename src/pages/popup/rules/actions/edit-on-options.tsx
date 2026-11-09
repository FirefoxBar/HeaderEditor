import { IconRoute } from '@douyinfe/semi-icons';
import browser from 'webextension-polyfill';
import { t } from '@/share/core/browser';
import { getTableName } from '@/share/core/utils';
import type { RuleAction } from './types';

export const editOnOptionsAction: RuleAction = {
  key: 'edit-on-options',
  icon: <IconRoute />,
  title: t('edit_on_options'),
  onClick: async rule => {
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
  },
};
