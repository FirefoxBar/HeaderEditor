import { Nav, Switch, Tooltip, Typography } from '@douyinfe/semi-ui';
import { IconMenu, IconSetting } from '@douyinfe/semi-icons';
import { css, cx } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { IS_ANDROID, t } from '@/share/core/utils';
import { prefs } from '@/share/core/prefs';
import Api from '@/share/pages/api';
import SemiLocale from '@/share/components/semi-locale';
import isDarkMode from '@/share/pages/is-dark-mode';
import Rules from './rule/rules';
import Group from './rule/group';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';

const basicStyle = css`
  min-width: 340px;
  min-height: 440px;
  height: 100vh;
  width: 100vw;
  justify-content: stretch;
  display: flex;
  flex-direction: row;

  > .navbar {
    flex-grow: 0;
    flex-shrink: 0;
  }

  > .main-content {
    flex-grow: 1;
    flex-shrink: 1;
    overflow: auto;
    background-color: var(--semi-color-fill-0);
    display: flex;
    flex-direction: column;

    .cell-enable {
      padding-right: 0;
      .switch-container {
        display: flex;
        align-items: center;
      }
    }

    .cell-action {
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }
  }
`;

const mobileStyle = css`
  min-height: auto;
  min-width: auto;
  min-width: auto;
  max-width: auto;
`;

const Popup = () => {
  const [enable, setEnable] = useState(true);

  useEffect(() => {
    prefs.ready(() => {
      setEnable(!prefs.get('disable-all'));
      // Get dark mode setting
      if (isDarkMode()) {
        document.body.setAttribute('theme-mode', 'dark');
      }
    });
  }, []);

  const handleEnableChange = useCallback((checked: boolean) => {
    setEnable(checked);
    Api.setPrefs('disable-all', !checked);
  }, []);

  const handleNavSelect = useCallback((data: OnSelectedData) => {
    const newActive = data.itemKey as string;
    if (newActive === 'setting') {
      Api.openURL(browser.runtime.getURL('options.html'));
      window.close();
    }
  }, []);

  return (
    <SemiLocale>
      <div
        className={cx(basicStyle, {
          [mobileStyle]: IS_ANDROID,
        })}
      >
        <Nav
          className="navbar semi-always-dark"
          selectedKeys={['rules']}
          onSelect={handleNavSelect}
          header={{
            logo: <img src="/assets/images/128.png" style={{ width: '36px' }} />,
            text: 'Header Editor',
          }}
          items={[
            { itemKey: 'rules', text: t('rule_list'), icon: <IconMenu /> },
            { itemKey: 'setting', text: t('manage'), icon: <IconSetting /> },
          ]}
          isCollapsed
          footer={
            <div>
              <Tooltip content={t('enable_he')} position="right">
                <Switch checked={enable} onChange={handleEnableChange} size="small" />
              </Tooltip>
            </div>
          }
        />
        <main className="main-content">
          <Rules />
          <Group />
          <div style={{ flexGrow: 1, minHeight: '20px' }} />
          <Typography.Text type="tertiary" style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}>{t('common_mark_tip')}</Typography.Text>
        </main>
      </div>
    </SemiLocale>
  );
};

export default Popup;
