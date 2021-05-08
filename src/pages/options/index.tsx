import Api from '@/share/core/api';
import { convertToRule } from '@/share/core/ruleUtils';
import { getDomain, t } from '@/share/core/utils';
import { Rule, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/var';
import '@/share/global.less';
import { Nav } from '@alifd/next';
import * as React from 'react';
import GroupSelect from './components/groupSelect';
import ImportAndExportSection from './components/importAndExport';
import OptionsSection from './components/options';
import RulesSection from './components/rules';
import Edit from './components/rules/edit';
import { parse } from 'querystring';
import './index.less';

interface OptionsState {
  active: string;
  editShow: boolean;
  editRule?: Rule;
}
export default class Options extends React.Component<any, OptionsState> {
  constructor(props: any) {
    super(props);

    this.handleSwitch = this.handleSwitch.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleEditClose = this.handleEditClose.bind(this);

    this.state = {
      editShow: false,
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

  handleSwitch(selectedKeys: string[]) {
    const active = selectedKeys[0];
    if (active && active !== this.state.active) {
      // 如果是帮助，不进行切换，打开新标签页
      if (active === 'help') {
        Api.openURL(t('url_help'));
      } else {
        this.setState({
          active,
        });
        window.scrollTo(0, 0);
      }
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
      <div className="page-options">
        <Nav
          className="navbar"
          direction="hoz"
          type="secondary"
          selectedKeys={[this.state.active]}
          onSelect={this.handleSwitch}
        >
          <Nav.Item key="rules">{t('rule_list')}</Nav.Item>
          <Nav.Item key="options">{t('options')}</Nav.Item>
          <Nav.Item key="export_and_import">{t('export_and_import')}</Nav.Item>
          <Nav.Item key="help">{t('help')}</Nav.Item>
        </Nav>
        <main className="main-content">
          <RulesSection visible={this.state.active === 'rules'} onEdit={this.handleEdit} />
          <OptionsSection visible={this.state.active === 'options'} />
          <ImportAndExportSection visible={this.state.active === 'export_and_import'} />
        </main>
        <GroupSelect />
        <Edit visible={this.state.editShow} rule={this.state.editRule} onClose={this.handleEditClose} />
      </div>
    );
  }
}
