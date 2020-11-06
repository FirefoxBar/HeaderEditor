import { Balloon, Button, Card, Dialog, Loading, Switch, Table } from '@alifd/next';
import { selectGroup } from 'options/lib/utils';
import * as React from 'react';
import Icon from 'share/components/icon';
import Api from 'share/core/api';
import emitter from 'share/core/emitter';
import { convertToTinyRule } from 'share/core/ruleUtils';
import { prefs } from 'share/core/storage';
import { getTableName, t } from 'share/core/utils';
import { InitedRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from 'share/core/var';
import './index.less';
import { remove, toggleRule } from './utils';

const V_KEY = '_v_key';

interface RulesProps {
  visible: boolean;
  onEdit: (rule?: Rule) => void;
}

interface GroupItem {
  name: string;
  rules: Rule[];
}

interface RulesState {
  loading: boolean;
  group: { [key: string]: GroupItem };
  isEnableSelect: boolean;
}

export default class Rules extends React.Component<RulesProps, RulesState> {
  private isCollapse = true;

  constructor(props: any) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
    this.handlePrefsUpdate = this.handlePrefsUpdate.bind(this);
    this.handleRuleUpdate = this.handleRuleUpdate.bind(this);
    this.handleHasRuleUpdate = this.handleHasRuleUpdate.bind(this);

    prefs.ready(() => {
      this.isCollapse = prefs.get('manage-collapse-group');
      this.load();
    });
    emitter.on(emitter.EVENT_PREFS_UPDATE, this.handlePrefsUpdate);
    emitter.on(emitter.EVENT_RULE_UPDATE, this.handleRuleUpdate);
    emitter.on(emitter.EVENT_HAS_RULE_UPDATE, this.handleHasRuleUpdate);

    this.state = {
      loading: false,
      group: {},
      isEnableSelect: false,
    };
  }

  handlePrefsUpdate(key: string, val: any) {
    if (key === 'manage-collapse-group') {
      this.isCollapse = val;
    }
  }

  componentWillUnmount() {
    emitter.off(emitter.EVENT_PREFS_UPDATE, this.handlePrefsUpdate);
    emitter.off(emitter.EVENT_HAS_RULE_UPDATE, this.handleHasRuleUpdate);
    emitter.off(emitter.EVENT_RULE_UPDATE, this.handleRuleUpdate);
  }

  // 事件响应
  handleRuleUpdate(rule: Rule) {
    const tableName = getTableName(rule.ruleType);
    if (!tableName) {
      return;
    }
    // 寻找ID相同的
    let sameItem: Rule | null = null;
    let fromGroup: Rule[] | null = null;
    let toGroup: Rule[] | null = null;
    const groups = Object.values(this.state.group);
    for (const group of groups) {
      for (const currentRule of group.rules) {
        if (currentRule.id === rule.id) {
          sameItem = currentRule;
          fromGroup = group.rules;
          break;
        }
      }
      // 另外找一下同名的group
      if (group.name === rule.group) {
        toGroup = group.rules;
      }
      if (sameItem && toGroup) {
        break;
      }
    }
    // 如果有找到，就替换掉，否则插入新的
    const displayRule = { ...rule, [V_KEY]: `${tableName}-${rule.id}` };
    if (sameItem && fromGroup) {
      if (fromGroup === toGroup) {
        // 在同一个Group里面，直接替换掉就行了
        fromGroup.splice(fromGroup.indexOf(sameItem), 1, displayRule);
      } else {
        fromGroup.splice(fromGroup.indexOf(sameItem), 1);
        if (toGroup) {
          toGroup.push(displayRule);
        } else {
          // 插入一个新的Group
          this.state.group[rule.group] = {
            name: rule.group,
            rules: [displayRule],
          };
        }
      }
    } else {
      if (toGroup) {
        toGroup.push(displayRule);
      } else {
        // 插入一个新的Group
        this.state.group[rule.group] = {
          name: rule.group,
          rules: [displayRule],
        };
      }
    }
    this.forceUpdate();
  }
  handleHasRuleUpdate() {
    this.load();
  }

  // 多选相关
  handleSelect(selectedRowKeys: any[], records: any[]) {
    console.log(selectedRowKeys, records);
  }

  // 切换规则开关
  handleToggleEnable(item: InitedRule, checked: boolean) {
    toggleRule(item, checked).then(() => this.forceUpdate());
  }

  // 更换分组
  handleChangeGroup(item: InitedRule) {
    selectGroup(item.group).then(newGroup => {
      const oldGroup = item.group;
      if (oldGroup === newGroup) {
        return;
      }
      item.group = newGroup;
      Api.saveRule(item).then(() => {
        const oldGroupRules = this.state.group[oldGroup].rules;
        oldGroupRules.splice(oldGroupRules.indexOf(item), 1);
        if (typeof this.state.group[newGroup] === 'undefined') {
          this.state.group[newGroup] = {
            name: newGroup,
            rules: [],
          };
        }
        this.state.group[newGroup].rules.push(item);
        this.forceUpdate();
      });
    });
  }

  // 删除
  handleDelete(item: InitedRule) {
    Dialog.confirm({
      content: t('delete_confirm'),
      onOk: () => {
        remove(item).then(() => {
          const group = this.state.group[item.group];
          group.rules.splice(group.rules.indexOf(item), 1);
          this.forceUpdate();
        });
      },
    });
  }

  // Clone
  handleClone(item: InitedRule) {
    const newItem = convertToTinyRule(item);
    newItem.name += '_clone';
    Api.saveRule(newItem).then(res => {
      console.log(res);
      this.state.group[item.group].rules.push(res);
      this.forceUpdate();
    });
  }

  load() {
    if (this.state.loading) {
      return;
    }
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
        item[V_KEY] = `${table}-${item.id}`;
        result[item.group].rules.push(item);
      });
      // 加载完成啦
      if (++finishCount >= TABLE_NAMES.length) {
        this.setState({
          group: result,
          loading: false,
        });
        emitter.emit(emitter.EVENT_GROUP_UPDATE, Object.keys(result));
      }
    };
    const requestRules = (table: TABLE_NAMES_TYPE) => {
      setTimeout(() => {
        Api.getRules(table).then(res => checkResult(table, res));
      });
    };
    TABLE_NAMES.forEach(table => requestRules(table));
  }

  render() {
    return (
      <section className={`section-rules ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <div className="helper-button">
          <Button
            className="button"
            size="large"
            onClick={() => this.setState({ isEnableSelect: !this.state.isEnableSelect })}
          >
            <Icon type="playlist-add-check" />
          </Button>
          <Button className="button" size="large" onClick={() => this.props.onEdit()}>
            <Icon type="add" />
          </Button>
        </div>
        <Loading size="large" visible={this.state.loading} inline={false}>
          {Object.values(this.state.group).map(group => {
            return (
              <Card
                key={group.name}
                showTitleBullet={false}
                title={group.name}
                contentHeight="auto"
                className="group-item"
              >
                <Table
                  dataSource={group.rules}
                  primaryKey={V_KEY}
                  rowSelection={
                    this.state.isEnableSelect
                      ? {
                          onChange: this.handleSelect,
                        }
                      : undefined
                  }
                >
                  <Table.Column
                    className="cell-enable"
                    title={t('enable')}
                    dataIndex="enable"
                    cell={(value: boolean, index: number, item: InitedRule) => {
                      return (
                        <Switch size="small" checked={value} onChange={this.handleToggleEnable.bind(this, item)} />
                      );
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
                        <Balloon.Tooltip className="rule-tooltip" trigger={<div>{value}</div>}>
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
                          <Button type="secondary" onClick={this.handleChangeGroup.bind(this, item)}>
                            <Icon type="playlist-add" />
                            {t('group')}
                          </Button>
                          <Button type="secondary" onClick={() => this.props.onEdit(item)}>
                            <Icon type="edit" />
                            {t('edit')}
                          </Button>
                          <Button type="secondary" onClick={this.handleClone.bind(this, item)}>
                            <Icon type="content-copy" />
                            {t('clone')}
                          </Button>
                          <Button type="secondary">
                            <Icon type="search" />
                            {t('view')}
                          </Button>
                          <Button type="secondary" onClick={this.handleDelete.bind(this, item)}>
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
