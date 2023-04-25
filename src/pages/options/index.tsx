import { Nav } from '@douyinfe/semi-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { IconFolderOpen, IconHelpCircle, IconMenu, IconSetting } from '@douyinfe/semi-icons';
import { useGetState, useResponsive } from 'ahooks';
import { convertToRule } from '@/share/core/rule-utils';
import { t } from '@/share/core/utils';
import { prefs } from '@/share/core/prefs';
import type { Rule } from '@/share/core/types';
import SemiLocale from '@/share/components/semi-locale';
import isDarkMode from '@/share/pages/is-dark-mode';
import GroupSelect from './sections/group-select';
import ImportAndExportSection from './sections/import-and-export';
import OptionsSection from './sections/options';
import RulesSection from './sections/rules';
import Edit from './sections/rules/edit';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';

const Options = () => {
  const [editShow, setEditShow] = useState(false);
  const [editRule, setEditRule] = useState<Rule>();
  const [navCollapse, setNavCollapse, getNavCollapse] = useGetState(false);
  const [active, setActive, getActive] = useGetState('rules');
  // 保存切换到帮助前是否为展开状态
  const isCollapsedRef = useRef(true);

  const responsive = useResponsive();

  useEffect(() => {
    prefs.ready(() => {
      if (isDarkMode()) {
        document.body.setAttribute('theme-mode', 'dark');
      }
    });
  }, []);

  const handleSwitch = useCallback((data: OnSelectedData) => {
    const newActive = data.itemKey as string;
    if (newActive && newActive !== getActive()) {
      if (newActive === 'help') {
        isCollapsedRef.current = getNavCollapse();
      }
      if (getActive() === 'help') {
        setNavCollapse(isCollapsedRef.current);
      } else {
        setNavCollapse(getNavCollapse() || newActive === 'help');
      }
      setActive(newActive);
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
    if (!responsive.lg && getNavCollapse()) {
      setNavCollapse(false);
    }
  }, [responsive.lg]);

  return (
    <SemiLocale>
      <div className={css`
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
          items={[
            { itemKey: 'rules', text: t('rule_list'), icon: <IconMenu /> },
            { itemKey: 'options', text: t('options'), icon: <IconSetting /> },
            { itemKey: 'export_and_import', text: t('export_and_import'), icon: <IconFolderOpen /> },
            { itemKey: 'help', text: t('help'), icon: <IconHelpCircle /> },
          ]}
          isCollapsed={navCollapse}
          onCollapseChange={setNavCollapse}
          footer={{
            collapseButton: true,
          }}
        />
        <main className="main-content">
          <RulesSection visible={active === 'rules'} onEdit={handleEdit} />
          <OptionsSection visible={active === 'options'} />
          <ImportAndExportSection visible={active === 'export_and_import'} />
          {active === 'help' && (
          <div className={css`
            width: 100%;
            height: 100%;

            > iframe {
              border: 0;
              width: 100%;
              height: 100%;
            }
          `}
          >
            <iframe src={t('url_help')} />
          </div>
          )}
        </main>
        <GroupSelect />
        <Edit visible={editShow} rule={editRule} onClose={handleEditClose} />
      </div>
    </SemiLocale>
  );
};

export default Options;
