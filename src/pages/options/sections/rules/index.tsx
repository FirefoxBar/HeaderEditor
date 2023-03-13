/* eslint-disable max-lines */
import { selectGroup } from '@/pages/options/lib/utils';
import { getExportName } from '@/pages/options/utils';
import Icon from '@/share/components/icon';
import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import file from '@/share/core/file';
import { convertToTinyRule, createExport } from '@/share/core/ruleUtils';
import { prefs } from '@/share/core/storage';
import { getTableName, t } from '@/share/core/utils';
import { InitdRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from '@/share/core/var';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Modal, Space, Spin, Typography } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import classNames from 'classnames';
import * as React from 'react';
import Float from './float';
import RuleCard from './rule-card';
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
    this.handleClone = this.handleClone.bind(this);
    this.handleToggleEnable = this.handleToggleEnable.bind(this);
    this.handlePreview = this.handlePreview.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleChangeGroup = this.handleChangeGroup.bind(this);

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
    } else if (toGroup) {
      toGroup.push(displayRule);
    } else {
      // 插入一个新的Group
      this.state.group[rule.group] = {
        name: rule.group,
        rules: [displayRule],
      };
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
  async handleChangeGroup(item: InitdRule) {
    const newGroup = await selectGroup(item.group);
    const oldGroup = item.group;
    if (oldGroup === newGroup) {
      return;
    }
    item.group = newGroup;
    await Api.saveRule(item);
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
  }

  // 删除
  handleDelete(item: InitdRule) {
    Modal.warning({
      title: t('delete_confirm'),
      onOk: async () => {
        await remove(item);
        const group = this.state.group[item.group];
        group.rules.splice(group.rules.indexOf(item), 1);
        this.forceUpdate();
      },
    });
  }

  // Clone
  handleClone(item: InitdRule) {
    const newItem = convertToTinyRule(item);
    newItem.name += '_clone';
    Api.saveRule(newItem).then((res) => {
      this.state.group[item.group].rules.push(res);
      this.forceUpdate();
    });
  }

  // 预览
  handlePreview(item: Rule) {
    this.setState((prevState) => {
      const newFloat = [...prevState.float];
      if (!newFloat.includes(item)) {
        newFloat.push(item);
      } else {
        newFloat.splice(newFloat.indexOf(item), 1);
      }
      return {
        float: newFloat,
      };
    });
  }

  // 切换多选状态
  toggleSelect() {
    this.setState((prevState) => ({
      isEnableSelect: !prevState.isEnableSelect,
      selectedKeys: [],
    }));
  }
  getSelectedRules() {
    const { selectedKeys, group } = this.state;
    if (selectedKeys.length === 0) {
      return [];
    }
    // 通过 V_KEY 筛选出所需要的
    const batch = ([] as Rule[])
      .concat(...Object.values(group).map((it) => it.rules))
      .filter((it) => selectedKeys.includes(it[V_KEY]));
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
      Object.values(this.state.group).forEach((g) => {
        g.rules.forEach((it) => {
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
    batch.forEach((rule) => {
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
    await Promise.all(table.map((tb) => Api.updateCache(tb)));
    this.forceUpdate();
  }
  // 批量移动群组
  handleBatchMove() {
    selectGroup().then((newGroup) => {
      const batch = this.getSelectedRules().filter((it) => it.group !== newGroup);
      batch.forEach((it) => {
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
      Promise.all(batch.map((item) => Api.saveRule(item))).then(() => this.forceUpdate());
    });
  }
  // 批量分享
  handleBatchShare() {
    batchShare(this.getSelectedRules());
  }
  // 批量删除
  handleBatchDelete() {
    Modal.warning({
      title: t('delete_confirm'),
      onOk: async () => {
        const batch = this.getSelectedRules();
        await Promise.all(
          batch.map(async (item) => {
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
    const { rules } = this.state.group[name];
    const result: any = {};
    TABLE_NAMES.forEach((tb) => {
      result[tb] = [];
    });
    rules.forEach((e) => result[getTableName(e.ruleType)].push(e));
    file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
  }
  async handleGroupRename(name: string) {
    const newGroup = await selectGroup(name);
    if (name === newGroup) {
      return;
    }
    // 更新规则
    const { rules } = this.state.group[name];
    for (const item of rules) {
      item.group = newGroup;
      await Api.saveRule(item);
    }
    this.setState((prevState) => {
      const result = { ...prevState, group: { ...prevState.group } };
      if (typeof result.group[newGroup] === 'undefined') {
        result.group[newGroup] = {
          name: newGroup,
          rules: result.group.group[name].rules,
        };
      } else {
        for (const item of rules) {
          result.group[newGroup].rules.push(item);
        }
      }
      if (prevState.collapsed.includes(name)) {
        const newCollapsed = [...prevState.collapsed];
        newCollapsed.splice(newCollapsed.indexOf(name), 1);
        newCollapsed.push(newGroup);
        result.collapsed = newCollapsed;
      }
      delete result.group[name];
      return result;
    });
  }
  handleGroupDelete(name: string) {
    Modal.confirm({
      title: t('delete_confirm'),
      onOk: async () => {
        const { rules } = this.state.group[name];
        await Promise.all(rules.map((item) => remove(item)));
        this.setState((prevState) => {
          const result = { ...prevState, group: { ...prevState.group } };
          if (prevState.collapsed.includes(name)) {
            const newCollapsed = [...prevState.collapsed];
            newCollapsed.splice(newCollapsed.indexOf(name), 1);
            result.collapsed = newCollapsed;
          }
          delete result.group[name];
          return result;
        });
      },
    });
  }
  handleCollapse(name: string) {
    this.setState((prevState) => {
      const collapsed = [...prevState.collapsed];
      if (collapsed.includes(name)) {
        collapsed.splice(collapsed.indexOf(name), 1);
      } else {
        collapsed.push(name);
      }
      return { collapsed };
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
    const checkResult = (table: TABLE_NAMES_TYPE, response: InitdRule[] | null) => {
      if (!response) {
        // Browser is starting up
        requestRules(table);
        return;
      }
      response.forEach((item) => {
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
        Api.getRules(table).then((res) => checkResult(table, res));
      });
    };
    TABLE_NAMES.forEach((table) => requestRules(table));
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
          className={css`
            display: flex;
            flex-direction: row;
            padding-bottom: 16px;
          `}
        >
          <Typography.Title heading={2}>{t('rule_list')}</Typography.Title>
          <div style={{ flexGrow: 1 }} />
          <Space>
            <ButtonGroup>
              {this.state.isEnableSelect && (
              <React.Fragment>
                <Button theme="light" type="tertiary" onClick={this.handleToggleSelectAll} icon={<Icon type="done-all" />}>
                  {t('select_all')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchEnable} icon={<Icon type="touch-app" />}>
                  {t('enable')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchMove} icon={<Icon type="playlist-add" />}>
                  {t('group')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchShare} icon={<Icon type="share" />}>
                  {t('share')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchDelete} icon={<Icon type="delete" />}>
                  {t('delete')}
                </Button>
              </React.Fragment>
              )}
              <Button theme="light" type="tertiary" onClick={this.toggleSelect} icon={<Icon type="playlist-add-check" />}>
                {t('batch_mode')}
              </Button>
            </ButtonGroup>
            <Button type="primary" theme="solid" onClick={() => this.props.onEdit()} icon={<IconPlusCircle />}>
              {t('add')}
            </Button>
          </Space>
        </div>
        <Spin size="large" spinning={this.state.loading}>
          <div
            className={css`
              height: calc(100vh - 88px);
              overflow: auto;
            `}
          >
            {Object.values(this.state.group).map((group) => {
              const { name } = group;
              return (
                <RuleCard
                  key={name}
                  name={group.name}
                  collapsed={collapsed.includes(name)}
                  rules={group.rules}
                  isEnableSelect={this.state.isEnableSelect}
                  onSelect={this.handleSelect}
                  selectedKeys={this.state.selectedKeys}
                  onRename={() => this.handleGroupRename(name)}
                  onShare={() => this.handleGroupShare(name)}
                  onDelete={() => this.handleGroupDelete(name)}
                  onCollapse={() => this.handleCollapse(name)}
                  onRuleEnable={this.handleToggleEnable}
                  onRuleChangeGroup={this.handleChangeGroup}
                  onRuleEdit={this.props.onEdit}
                  onRuleClone={this.handleClone}
                  onRuleDelete={this.handleDelete}
                  onRulePreview={this.handlePreview}
                />
              );
            })}
          </div>
        </Spin>
        {this.state.float.map((it) => (
          <Float key={it[V_KEY]} rule={it} onClose={() => this.handlePreview(it)} />
        ))}
      </section>
    );
  }
}
