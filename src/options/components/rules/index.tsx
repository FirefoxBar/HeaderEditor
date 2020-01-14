import { Balloon, Card, Loading, Switch, Table, Button } from '@alifd/next';
import * as React from 'react';
import emit from 'share/core/emit';
import rules from 'share/core/rules';
import { prefs } from 'share/core/storage';
import { t } from 'share/core/utils';
import { InitedRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from 'share/core/var';
import './index.less';
import Icon from 'share/components/icon';

interface RulesProps {
  visible: boolean;
}

interface GroupItem {
  name: string;
  rules: Rule[];
}

interface RulesState {
  loading: boolean;
  group: { [key: string]: GroupItem };
}

export default class Rules extends React.Component<RulesProps, RulesState> {
  private isCollapse = true;

  constructor(props: any) {
    super(props);

    this.handlePrefsUpdate = this.handlePrefsUpdate.bind(this);

    prefs.ready(() => {
      this.isCollapse = prefs.get('manage-collapse-group');
      this.load();
    });
    emit.on(emit.EVENT_PREFS_UPDATE, this.handlePrefsUpdate);

    this.state = {
      loading: false,
      group: {},
      /*
      rowSelection: {
        onChange: this.onChange.bind(this),
        onSelect: function(selected, record, records) {
            console.log('onSelect', selected, record, records);
        },
        onSelectAll: function(selected, records) {
            console.log('onSelectAll', selected, records);
        },
        selectedRowKeys: [100306660940, 100306660941],
        getProps: (record) => {
            return {
                disabled: record.id === 100306660941
            };
        }
      },
      */
    };
  }

  handlePrefsUpdate(key: string, val: any) {
    if (key === 'manage-collapse-group') {
      this.isCollapse = val;
    }
  }

  componentWillUnmount() {
    emit.off(emit.EVENT_PREFS_UPDATE, this.handlePrefsUpdate);
  }

  load() {
    if (this.state.loading) {
      return;
    }
    console.log('start loading');
    this.setState({
      group: {},
      loading: true,
    });
    const result = {
      [t('ungrouped')]: {
        name: t('ungrouped'),
        rules: [] as Rule[],
      },
    };
    // 记录总数
    let finishCount = 0;
    const checkResult = (table: TABLE_NAMES_TYPE, response: InitedRule[] | null) => {
      if (!response) {
        // Browser is starting up
        requestRules(table);
        return;
      }
      response.forEach(item => {
        if (typeof result[item.group] === 'undefined') {
          result[item.group] = {
            name: item.group,
            rules: [],
          };
        }
        item._v_key = `${table}-${item.id}`;
        result[item.group].rules.push(item);
      });
      // 加载完成啦
      console.log('finish loading one');
      if (++finishCount >= TABLE_NAMES.length) {
        this.setState({
          group: result,
          loading: false,
        });
      }
    };
    const requestRules = (table: TABLE_NAMES_TYPE) => {
      setTimeout(() => {
        checkResult(table, rules.get(table));
      });
    };
    TABLE_NAMES.forEach(table => requestRules(table));
  }

  render() {
    return (
      <section className={`section-rules ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Loading size="large" visible={this.state.loading} inline={false}>
          {Object.values(this.state.group).map(group => {
            return (
              <Card
                key={group.name}
                showTitleBullet={false}
                title={group.name}
                contentHeight={this.isCollapse ? 0 : 'auto'}
                className="group-item"
              >
                <Table dataSource={group.rules}>
                  <Table.Column
                    className="cell-enable"
                    title={t('enable')}
                    dataIndex="enable"
                    cell={(value: boolean, index: number, item: InitedRule) => {
                      return <Switch size="small" checked={value} />;
                    }}
                  />
                  <Table.Column
                    className="cell-name"
                    title={t('name')}
                    dataIndex="name"
                    cell={(value: string, index: number, item: InitedRule) => {
                      const isModifyHeader =
                        item.ruleType === 'modifySendHeader' ||
                        (item.ruleType === 'modifyReceiveHeader' && !item.isFunction);
                      return (
                        <Balloon.Tooltip trigger={<div>{value}</div>}>
                          <p>
                            {t('matchType')}: {t(`match_${item.matchType}`)}
                          </p>
                          {item.matchType !== 'all' && (
                            <p>
                              {t('matchRule')}: {item.pattern}
                            </p>
                          )}
                          <p>
                            {t('exec_type')}: {t('exec_' + (item.isFunction ? 'function' : 'normal'))}
                          </p>
                          {item.ruleType === 'redirect' && (
                            <p>
                              {t('redirectTo')}: {item.to}
                            </p>
                          )}
                          {item.ruleType === 'modifyReceiveBody' && (
                            <p>
                              {t('encoding')}: {item.encoding}
                            </p>
                          )}
                          {isModifyHeader && (
                            <React.Fragment>
                              <p>
                                {t('headerName')}: {typeof item.action === 'object' && item.action.name}
                              </p>
                              <p>
                                {t('headerValue')}: {typeof item.action === 'object' && item.action.value}
                              </p>
                            </React.Fragment>
                          )}
                        </Balloon.Tooltip>
                      );
                    }}
                  />
                  <Table.Column
                    className="cell-type"
                    title={t('ruleType')}
                    dataIndex="ruleType"
                    cell={(value: string) => t(`rule_${value}`)}
                  />
                  <Table.Column
                    className="cell-action"
                    title={t('action')}
                    cell={(value: string, index: number, item: InitedRule) => {
                      return (
                        <div className="buttons">
                          <Button type="secondary">
                            <Icon type="playlist-add" />
                            {t('group')}
                          </Button>
                          <Button type="secondary">
                            <Icon type="edit" />
                            {t('edit')}
                          </Button>
                          <Button type="secondary">
                            <Icon type="content-copy" />
                            {t('clone')}
                          </Button>
                          <Button type="secondary">
                            <Icon type="search" />
                            {t('view')}
                          </Button>
                          <Button type="secondary">
                            <Icon type="delete" />
                            {t('delete')}
                          </Button>
                        </div>
                      );
                    }}
                  />
                </Table>
              </Card>
            );
          })}
        </Loading>
      </section>
    );
  }
}
