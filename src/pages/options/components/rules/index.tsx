import { Balloon, Button, Card, Dialog, Loading, Switch, Table } from '@alifd/next';
import classNames from 'classnames';
import { selectGroup } from '@/pages/options/lib/utils';
import { getExportName } from '@/pages/options/utils';
import * as React from 'react';
import Icon from '@/share/components/icon';
import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import file from '@/share/core/file';
import { convertToTinyRule, createExport } from '@/share/core/ruleUtils';
import { prefs } from '@/share/core/storage';
import { getTableName, t } from '@/share/core/utils';
import { InitdRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from '@/share/core/var';
import Float from './float';
import './index.less';
import RuleDetail from './ruleDetail';
import { batchShare, remove, toggleRule } from './utils';

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
  selectedKeys: string[];
  float: Rule[];
  collapsed: string[];
}

export default class Rules extends React.Component<RulesProps, RulesState> {
  // 默认展开/收起
  private isCollapse = true;

  constructor(props: any) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
    this.handleRuleUpdate = this.handleRuleUpdate.bind(this);
    this.handleHasRuleUpdate = this.handleHasRuleUpdate.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.handleToggleSelectAll = this.handleToggleSelectAll.bind(this);
    this.handleBatchEnable = this.handleBatchEnable.bind(this);
    this.handleBatchMove = this.handleBatchMove.bind(this);
    this.handleBatchShare = this.handleBatchShare.bind(this);
    this.handleBatchDelete = this.handleBatchDelete.bind(this);

    prefs.ready(() => {
      this.isCollapse = prefs.get('manage-collapse-group');
      this.load();
    });
    emitter.on(emitter.EVENT_RULE_UPDATE, this.handleRuleUpdate);
    emitter.on(emitter.EVENT_HAS_RULE_UPDATE, this.handleHasRuleUpdate);

    this.state = {
      loading: false,
      group: {},
      isEnableSelect: false,
      selectedKeys: [],
      float: [],
      collapsed: [],
    };
  }

  componentWillUnmount() {
    emitter.off(emitter.EVENT_HAS_RULE_UPDATE, this.handleHasRuleUpdate);
    emitter.off(emitter.EVENT_RULE_UPDATE, this.handleRuleUpdate);
  }

  // 事件响应
  handleRuleUpdate(rule: Rule) {
    const tableName = getTableName(rule.ruleType);
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
  handleSelect(selectedRowKeys: any[]) {
    this.setState({
      selectedKeys: selectedRowKeys,
    });
  }

  // 切换规则开关
  handleToggleEnable(item: InitdRule, checked: boolean) {
    toggleRule(item, checked).then(() => this.forceUpdate());
  }

  // 更换分组
  handleChangeGroup(item: InitdRule) {
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
  handleDelete(item: InitdRule) {
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
  handleClone(item: InitdRule) {
    const newItem = convertToTinyRule(item);
    newItem.name += '_clone';
    Api.saveRule(newItem).then(res => {
      this.state.group[item.group].rules.push(res);
      this.forceUpdate();
    });
  }

  // 预览
  handlePreview(item: Rule) {
    const newFloat = [...this.state.float];
    if (!this.state.float.includes(item)) {
      newFloat.push(item);
    } else {
      newFloat.splice(newFloat.indexOf(item), 1);
    }
    this.setState({
      float: newFloat,
    });
  }

  // 切换多选状态
  toggleSelect() {
    this.setState({
      isEnableSelect: !this.state.isEnableSelect,
      selectedKeys: [],
    });
  }
  getSelectedRules() {
    const { selectedKeys, group } = this.state;
    if (selectedKeys.length === 0) {
      return [];
    }
    // 通过 V_KEY 筛选出所需要的
    const batch = ([] as Rule[])
      .concat(...Object.values(group).map(it => it.rules))
      .filter(it => selectedKeys.includes(it[V_KEY]));
    return batch;
  }

  // 切换全选/全不选
  handleToggleSelectAll() {
    if (this.state.selectedKeys.length > 0) {
      this.setState({
        selectedKeys: [],
      });
    } else {
      const keys: string[] = [];
      Object.values(this.state.group).forEach(g => {
        g.rules.forEach(it => {
          keys.push(it[V_KEY]);
        });
      });
      this.setState({
        selectedKeys: keys,
      });
    }
  }

  // 切换开启、关闭状态
  async handleBatchEnable() {
    const batch = this.getSelectedRules();
    if (batch.length === 0) {
      return;
    }
    const queue: Array<Promise<any>> = [];
    const table: TABLE_NAMES_TYPE[] = [];
    const setTo = !batch[0].enable;
    batch.forEach(rule => {
      if (rule.enable === setTo) {
        return;
      }
      rule.enable = setTo;
      queue.push(Api.saveRule(rule));
      const tableName = getTableName(rule.ruleType);
      if (!table.includes(tableName)) {
        table.push(tableName);
      }
    });
    await Promise.all(queue);
    await Promise.all(table.map(tb => Api.updateCache(tb)));
    this.forceUpdate();
  }
  // 批量移动群组
  handleBatchMove() {
    selectGroup().then(newGroup => {
      const batch = this.getSelectedRules().filter(it => it.group !== newGroup);
      batch.forEach(it => {
        const oldGroup = it.group;
        it.group = newGroup;
        const oldGroupRules = this.state.group[oldGroup].rules;
        oldGroupRules.splice(oldGroupRules.indexOf(it), 1);
        if (oldGroupRules.length === 0) {
          delete this.state.group[newGroup];
        }
        if (typeof this.state.group[newGroup] === 'undefined') {
          this.state.group[newGroup] = {
            name: newGroup,
            rules: [],
          };
        }
        this.state.group[newGroup].rules.push(it);
      });
      Promise.all(batch.map(item => Api.saveRule(item))).then(() => this.forceUpdate());
    });
  }
  // 批量分享
  handleBatchShare() {
    batchShare(this.getSelectedRules());
  }
  // 批量删除
  handleBatchDelete() {
    Dialog.confirm({
      content: t('delete_confirm'),
      onOk: async () => {
        const batch = this.getSelectedRules();
        await Promise.all(
          batch.map(async item => {
            await remove(item);
            const group = this.state.group[item.group];
            group.rules.splice(group.rules.indexOf(item), 1);
          }),
        );
        this.forceUpdate();
      },
    });
  }

  handleGroupShare(name: string) {
    const rules = this.state.group[name].rules;
    const result: any = {};
    TABLE_NAMES.forEach(tb => (result[tb] = []));
    rules.forEach(e => result[getTableName(e.ruleType)].push(e));
    file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
  }
  handleGroupRename(name: string) {
    selectGroup(name).then(async newGroup => {
      if (name === newGroup) {
        return;
      }
      // 更新规则
      const rules = this.state.group[name].rules;
      for (const item of rules) {
        item.group = newGroup;
        await Api.saveRule(item);
      }
      const newStateGroup = { ...this.state.group };
      if (typeof newStateGroup[newGroup] === 'undefined') {
        newStateGroup[newGroup] = {
          name: newGroup,
          rules: this.state.group[name].rules,
        };
      } else {
        for (const item of rules) {
          newStateGroup[newGroup].rules.push(item);
        }
      }
      if (this.state.collapsed.includes(name)) {
        const newCollapsed = [...this.state.collapsed];
        newCollapsed.splice(newCollapsed.indexOf(name), 1);
        newCollapsed.push(newGroup);
        this.setState({ collapsed: newCollapsed });
      }
      delete newStateGroup[name];
      this.setState({ group: newStateGroup });
    });
  }
  handleGroupDelete(name: string) {
    Dialog.confirm({
      content: t('delete_confirm'),
      onOk: async () => {
        const rules = this.state.group[name].rules;
        await Promise.all(rules.map(item => remove(item)));
        const newGroup = {
          ...this.state.group,
        };
        if (this.state.collapsed.includes(name)) {
          const newCollapsed = [...this.state.collapsed];
          newCollapsed.splice(newCollapsed.indexOf(name), 1);
          this.setState({ collapsed: newCollapsed });
        }
        delete newGroup[name];
        this.setState({ group: newGroup });
      },
    });
  }
  handleCollapse(name: string) {
    const collapsed = [...this.state.collapsed];
    if (collapsed.includes(name)) {
      collapsed.splice(collapsed.indexOf(name), 1);
    } else {
      collapsed.push(name);
    }
    this.setState({ collapsed });
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
    const checkResult = (table: TABLE_NAMES_TYPE, response: InitdRule[] | null) => {
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
        // 默认是否展开
        const collapsed = this.isCollapse ? [] : Object.keys(result);
        this.setState({
          group: result,
          collapsed,
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
    const { collapsed } = this.state;

    return (
      <section
        className={classNames('section-rules', {
          visible: this.props.visible,
          'in-visible': !this.props.visible,
        })}
      >
        <div
          className={classNames('helper-button', {
            enable: this.state.isEnableSelect,
          })}
        >
          {this.state.isEnableSelect && (
            <React.Fragment>
              <Button className="button" size="large" title={t('select_all')} onClick={this.handleToggleSelectAll}>
                <Icon type="done-all" />
              </Button>
              <Button className="button" size="large" title={t('enable')} onClick={this.handleBatchEnable}>
                <Icon type="touch-app" />
              </Button>
              <Button className="button" size="large" title={t('group')} onClick={this.handleBatchMove}>
                <Icon type="playlist-add" />
              </Button>
              <Button className="button" size="large" title={t('share')} onClick={this.handleBatchShare}>
                <Icon type="share" />
              </Button>
              <Button className="button" size="large" title={t('delete')} onClick={this.handleBatchDelete}>
                <Icon type="delete" />
              </Button>
            </React.Fragment>
          )}
          <Button className="button" size="large" onClick={this.toggleSelect}>
            <Icon type="playlist-add-check" />
          </Button>
          <Button className="button" size="large" onClick={() => this.props.onEdit()}>
            <Icon type="add" />
          </Button>
        </div>
        <Loading size="large" visible={this.state.loading} inline={false}>
          {Object.values(this.state.group).map(group => {
            const { name } = group;
            return (
              <Card
                key={name}
                showTitleBullet={false}
                title={name}
                extra={
                  <div className="group-item-actions">
                    <Button.Group>
                      {name !== t('ungrouped') && (
                        <Balloon.Tooltip
                          className="rule-tooltip"
                          trigger={
                            <Button type="normal" onClick={this.handleGroupRename.bind(this, name)}>
                              <i className="iconfont icon-edit" />
                            </Button>
                          }
                        >
                          {t('rename')}
                        </Balloon.Tooltip>
                      )}
                      <Balloon.Tooltip
                        className="rule-tooltip"
                        trigger={
                          <Button type="normal" onClick={this.handleGroupShare.bind(this, name)}>
                            <i className="iconfont icon-share" />
                          </Button>
                        }
                      >
                        {t('share')}
                      </Balloon.Tooltip>
                      {name !== t('ungrouped') && (
                        <Balloon.Tooltip
                          className="rule-tooltip"
                          trigger={
                            <Button type="normal" onClick={this.handleGroupDelete.bind(this, name)}>
                              <i className="iconfont icon-delete" />
                            </Button>
                          }
                        >
                          {t('delete')}
                        </Balloon.Tooltip>
                      )}
                    </Button.Group>
                    <Button type="normal" onClick={this.handleCollapse.bind(this, name)}>
                      <i className="iconfont icon-keyboard-arrow-down collapse-icon" />
                    </Button>
                  </div>
                }
                contentHeight="auto"
                className={classNames('group-item', {
                  'is-hide': !collapsed.includes(name),
                })}
              >
                <Table
                  dataSource={group.rules}
                  primaryKey={V_KEY}
                  rowSelection={
                    this.state.isEnableSelect
                      ? {
                          onChange: this.handleSelect,
                          selectedRowKeys: this.state.selectedKeys,
                        }
                      : undefined
                  }
                >
                  <Table.Column
                    className="cell-enable"
                    title={t('enable')}
                    alignHeader="left"
                    align="center"
                    dataIndex="enable"
                    cell={(value: boolean, index: number, item: InitdRule) => {
                      return (
                        <Switch size="small" checked={value} onChange={this.handleToggleEnable.bind(this, item)} />
                      );
                    }}
                  />
                  <Table.Column
                    className="cell-name"
                    title={t('name')}
                    dataIndex="name"
                    cell={(value: string, index: number, item: InitdRule) => {
                      return (
                        <Balloon.Tooltip className="rule-tooltip" trigger={<div>{value}</div>}>
                          <RuleDetail rule={item} />
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
                    cell={(value: string, index: number, item: InitdRule) => {
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
                          <Button type="secondary" onClick={this.handlePreview.bind(this, item)}>
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
        {this.state.float.map(it => (
          <Float key={it[V_KEY]} rule={it} onClose={() => this.handlePreview(it)} />
        ))}
      </section>
    );
  }
}
