import {
  IconCustomerSupport,
  IconDownload,
  IconFolderOpen,
  IconHelpCircle,
  IconMenu,
  IconSetting,
} from '@douyinfe/semi-icons';
import { Nav } from '@douyinfe/semi-ui';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { useGetState, useResponsive } from 'ahooks';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import SemiLocale from '@/share/components/semi-locale';
import { t } from '@/share/core/browser';
import { prefs } from '@/share/core/prefs';
import { convertToRule } from '@/share/core/rule-utils';
import type { Rule } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
import Api from '@/share/pages/api';
import isDarkMode from '@/share/pages/is-dark-mode';
import Help from './help';
import { Message } from './message';
import Download from './sections/download';
import GroupSelect from './sections/group-select';
import ImportAndExportSection from './sections/import-and-export';
import OptionsSection from './sections/options';
import RulesSection from './sections/rules';
import Edit from './sections/rules/edit';

import './global.less';

const Options = () => {
  const [editShow, setEditShow] = useState(false);
  const [editRule, setEditRule] = useState<Rule>();
  const [targetRule] = useState(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('edit') !== '1') {
      return undefined;
    }

    const table = params.get('table');
    const id = Number(params.get('ruleId'));

    if (!table || !Number.isSafeInteger(id) || id <= 0) {
      return undefined;
    }

    return { table, id };
  });
  const [navCollapse, setNavCollapse, getNavCollapse] = useGetState(false);
  const [active, setActive, getActive] = useGetState('rules');

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
    if (newActive && newActive !== getActive()) {
      setActive(newActive);
      window.scrollTo(0, 0);
    }
  }, []);

  const handleEditClose = useCallback(() => {
    setEditShow(false);
    setEditRule(undefined);

    const url = new URL(window.location.href);
    url.searchParams.delete('table');
    url.searchParams.delete('ruleId');
    url.searchParams.delete('edit');
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  const handleEdit = useCallback((rule?: Rule) => {
    const url = new URL(window.location.href);

    if (rule) {
      url.searchParams.set('table', getTableName(rule.ruleType));
      url.searchParams.set('ruleId', String(rule.id));
      url.searchParams.set('edit', '1');
    } else {
      url.searchParams.delete('table');
      url.searchParams.delete('ruleId');
      url.searchParams.delete('edit');
    }

    window.history.replaceState(window.history.state, '', url.toString());

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
      <div className="page">
        <Nav
          className="navbar semi-always-dark"
          selectedKeys={[active]}
          onSelect={handleSwitch}
          header={{
            logo: (
              <img src="/assets/images/logo.svg" style={{ width: '36px' }} />
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
            {
              itemKey: 'download',
              text: t('download_rule'),
              icon: <IconDownload />,
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
          <RulesSection
            visible={active === 'rules'}
            onEdit={handleEdit}
            targetRule={targetRule}
          />
          <OptionsSection visible={active === 'options'} />
          <ImportAndExportSection visible={active === 'export_and_import'} />
          <Download visible={active === 'download'} />
          <Help visible={active === 'help'} />
        </main>
        <GroupSelect />
        <Edit visible={editShow} rule={editRule} onClose={handleEditClose} />
        <Message />
      </div>
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
