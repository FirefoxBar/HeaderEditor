import {
  IconCustomerSupport,
  IconFolderOpen,
  IconHelpCircle,
  IconMenu,
  IconSetting,
} from '@douyinfe/semi-icons';
import { Nav } from '@douyinfe/semi-ui';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { css } from '@emotion/css';
import { useGetState, useLatest, useResponsive } from 'ahooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import SemiLocale from '@/share/components/semi-locale';
import { prefs } from '@/share/core/prefs';
import { convertToRule } from '@/share/core/rule-utils';
import type { Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import isDarkMode from '@/share/pages/is-dark-mode';
import { Message } from './message';
import GroupSelect from './sections/group-select';
import Help from './sections/help';
import ImportAndExportSection from './sections/import-and-export';
import OptionsSection from './sections/options';
import RulesSection from './sections/rules';
import Edit from './sections/rules/edit';
import Tasks from './sections/tasks';

const Options = () => {
  const [editShow, setEditShow] = useState(false);
  const [editRule, setEditRule] = useState<Rule>();
  const [navCollapse, setNavCollapse, getNavCollapse] = useGetState(false);
  // router
  const { pathname } = useLocation();
  const active = pathname.substring(1);
  const activeRef = useLatest(active);
  const navigate = useNavigate();
  // 保存切换到帮助前是否为展开状态
  const isCollapsedRef = useRef(true);

  const responsive = useResponsive();

  useEffect(() => {
    document.body.setAttribute('data-page-name', 'options');
    prefs.ready(() => {
      if (isDarkMode()) {
        document.body.setAttribute('theme-mode', 'dark');
      }
    });
  }, []);

  const handleSwitch = useCallback((data: OnSelectedData) => {
    const newActive = data.itemKey as string;
    if (newActive === 'feedback') {
      Api.openURL('https://github.com/FirefoxBar/HeaderEditor/issues');
      return;
    }
    if (newActive && newActive !== activeRef.current) {
      if (newActive === 'help') {
        isCollapsedRef.current = getNavCollapse();
      }
      if (activeRef.current === 'help') {
        setNavCollapse(isCollapsedRef.current);
      } else {
        setNavCollapse(getNavCollapse() || newActive === 'help');
      }
      navigate(`/${newActive}`);
      window.scrollTo(0, 0);
    }
  }, []);

  const handleEditClose = useCallback(() => {
    setEditShow(false);
    setEditRule(undefined);
  }, []);

  const handleEdit = useCallback((rule?: Rule) => {
    setEditShow(true);
    setEditRule(rule ? convertToRule(rule) : undefined);
  }, []);

  useEffect(() => {
    // 小屏幕主动收起侧边栏
    if (!responsive.lg && !getNavCollapse()) {
      setNavCollapse(true);
    }
  }, [responsive.lg]);

  return (
    <SemiLocale>
      <BrowserRouter>
        <div
          className={css`
        display: flex;
        flex-direction: row;
        height: 100vh;

        > .navbar {
          /* width: 240px; */
          flex-grow: 0;
          flex-shrink: 0;
          height: 100vh;
        }

        > .main-content {
          flex-grow: 1;
          flex-shrink: 1;
          height: 100vh;
          overflow: auto;
          box-sizing: border-box;
          padding: 16px;
          background-color: var(--semi-color-fill-0);

          > .in-visible {
            display: none;
          }

          > section {
            > .semi-card {
              margin-bottom: 16px;
            }
          }
        }
      `}
        >
          <Nav
            className="navbar semi-always-dark"
            selectedKeys={[active]}
            onSelect={handleSwitch}
            header={{
              logo: (
                <img src="/assets/images/128.png" style={{ width: '36px' }} />
              ),
              text: 'Header Editor',
            }}
            items={[
              { itemKey: 'rules', text: t('rule_list'), icon: <IconMenu /> },
              { itemKey: 'options', text: t('options'), icon: <IconSetting /> },
              {
                itemKey: 'export_and_import',
                text: t('export_and_import'),
                icon: <IconFolderOpen />,
              },
              { itemKey: 'help', text: t('help'), icon: <IconHelpCircle /> },
              {
                itemKey: 'feedback',
                text: t('feedback'),
                icon: <IconCustomerSupport />,
              },
            ]}
            isCollapsed={navCollapse}
            onCollapseChange={setNavCollapse}
            footer={{
              collapseButton: true,
            }}
          />
          <main className="main-content">
            <Routes>
              <Route index element={<RulesSection onEdit={handleEdit} />} />
              <Route path="options" element={<OptionsSection />} />
              <Route path="tasks" element={<Tasks />} />
              <Route
                path="exportAndImport"
                element={<ImportAndExportSection />}
              />
              <Route path="help" element={<Help />} />
            </Routes>
          </main>
          <GroupSelect />
          <Edit visible={editShow} rule={editRule} onClose={handleEditClose} />
          <Message />
        </div>
      </BrowserRouter>
    </SemiLocale>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>,
  );
}
