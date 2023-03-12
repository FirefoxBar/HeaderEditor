import { convertToRule } from '@/share/core/ruleUtils';
import { getDomain, t } from '@/share/core/utils';
import { Rule, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/var';
import '@/share/global.less';
import { Nav } from '@douyinfe/semi-ui';
import * as React from 'react';
import GroupSelect from './sections/groupSelect';
import ImportAndExportSection from './sections/importAndExport';
import OptionsSection from './sections/options';
import RulesSection from './sections/rules';
import Edit from './sections/rules/edit';
import { parse } from 'querystring';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { css } from '@emotion/css';
import { IconFolderOpen, IconHelpCircle, IconMenu, IconSetting } from '@douyinfe/semi-icons';
import SemiLocale from '@/share/components/semi-locale';

interface OptionsState {
  active: string;
  navCollapse: boolean;
  editShow: boolean;
  editRule?: Rule;
}
export default class Options extends React.Component<any, OptionsState> {
  // 保存切换到帮助前是否为展开状态
  private isCollapsed = true;

  constructor(props: any) {
    super(props);

    this.handleSwitch = this.handleSwitch.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleEditClose = this.handleEditClose.bind(this);

    this.state = {
      editShow: false,
      navCollapse: false,
      active: 'rules',
    };
  }

  componentDidMount() {
    // init anti-hot-link
    const query = parse(window.location.search.substr(1));

    if (query.action && query.action === 'add-anti-hot-link') {
      this.setState({
        editShow: true,
        editRule: {
          id: -1,
          enable: true,
          name: '',
          ruleType: RULE_TYPE.MODIFY_SEND_HEADER,
          matchType: RULE_MATCH_TYPE.DOMAIN,
          pattern: getDomain(query.url as string) || '',
          isFunction: false,
          code: '',
          exclude: '',
          group: t('ungrouped'),
          action: {
            name: 'referer',
            value: '',
          },
        },
      });
    }
  }

  handleSwitch(data: OnSelectedData) {
    const active = data.itemKey as string;
    if (active && active !== this.state.active) {
      if (active === 'help') {
        this.isCollapsed = this.state.navCollapse;
      }
      const newState = {
        active,
        navCollapse: this.state.navCollapse || active === 'help',
      };
      if (this.state.active === 'help') {
        newState.navCollapse = this.isCollapsed;
      }
      this.setState(newState);
      window.scrollTo(0, 0);
    }
  }

  handleEditClose() {
    this.setState({
      editShow: false,
      editRule: undefined,
    });
  }

  handleEdit(rule?: Rule) {
    this.setState({
      editShow: true,
      editRule: rule ? convertToRule(rule) : undefined,
    });
  }

  render() {
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
            className="navbar"
            selectedKeys={[this.state.active]}
            onSelect={this.handleSwitch}
            items={[
              { itemKey: 'rules', text: t('rule_list'), icon: <IconMenu /> },
              { itemKey: 'options', text: t('options'), icon: <IconSetting /> },
              { itemKey: 'export_and_import', text: t('export_and_import'), icon: <IconFolderOpen /> },
              { itemKey: 'help', text: t('help'), icon: <IconHelpCircle /> },
            ]}
            isCollapsed={this.state.navCollapse}
            onCollapseChange={(v) => this.setState({ navCollapse: v })}
            footer={{
              collapseButton: true,
            }}
          />
          <main className="main-content">
            <RulesSection visible={this.state.active === 'rules'} onEdit={this.handleEdit} />
            <OptionsSection visible={this.state.active === 'options'} />
            <ImportAndExportSection visible={this.state.active === 'export_and_import'} />
            {this.state.active === 'help' && (
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
              <iframe src="https://he.firefoxcn.net/zh-CN/guide.html" />
            </div>
            )}
          </main>
          <GroupSelect />
          <Edit visible={this.state.editShow} rule={this.state.editRule} onClose={this.handleEditClose} />
        </div>
      </SemiLocale>
    );
  }
}
