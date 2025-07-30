import { IconMenu, IconSetting } from '@douyinfe/semi-icons';
import { Nav, Switch, Tooltip, Typography } from '@douyinfe/semi-ui';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { css, cx } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';
import SemiLocale from '@/share/components/semi-locale';
import { prefs } from '@/share/core/prefs';
import { IS_ANDROID, t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import isDarkMode from '@/share/pages/is-dark-mode';
import Group from './rule/group';
import Rules from './rule/rules';

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

    .item-block {
      display: flex;
      flex-direction: column;

      > .item {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
        background-color: #fff;
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
      }
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
    document.body.setAttribute('data-page-name', 'popup');
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
            logo: (
              <img src="/assets/images/128.png" style={{ width: '36px' }} />
            ),
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
                <Switch
                  checked={enable}
                  onChange={handleEnableChange}
                  size="small"
                />
              </Tooltip>
            </div>
          }
        />
        <main className="main-content">
          <Rules />
          <Group />
          <div style={{ flexGrow: 1, minHeight: '20px' }} />
          <Typography.Text
            type="tertiary"
            style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}
          >
            {t('common_mark_tip')}
          </Typography.Text>
        </main>
      </div>
    </SemiLocale>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
  );
}

if (typeof window !== 'undefined' && typeof window.browser === 'undefined') {
  window.browser = browser;
}
