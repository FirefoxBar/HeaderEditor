/* eslint-disable max-lines */
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
import { Button, ButtonGroup, Card, Modal, Popover, Space, Spin, Switch, Table, Tooltip } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import { IconChevronDown, IconSend } from '@douyinfe/semi-icons';

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
        <Spin size="large" spinning={this.state.loading}>
          {Object.values(this.state.group).map((group) => {
            const { name } = group;
            return (
              <Card
                className={css`
                  margin-bottom: 12px;

                  .semi-card-header-wrapper {
                    display: flex;
                    flex-direction: row-reverse;
                    align-items: center;
                  }

                  .semi-card-body {
                    padding: 0;
                    display: ${!collapsed.includes(name) ? 'none' : 'block'}
                  }
                `}
                key={name}
                title={name}
                headerExtraContent={
                  <ButtonGroup
                    className={cx(css`
                      display: flex;
                      flex-direction: row;

                      .collapse-icon {
                        display: inline-block;
                        transition: all .2s ease;
                        transform: rotateZ(180deg);
                      }
                    `, !collapsed.includes(name) ? css`
                        .collapse-icon {
                        transform: rotateZ(0deg);
                      }
                    ` : '')}
                  >
                    {name !== t('ungrouped') && (
                    <Tooltip content={t('rename')}>
                      <Button type="tertiary" onClick={this.handleGroupRename.bind(this, name)} icon={<i className="iconfont icon-edit" />} />
                    </Tooltip>
                    )}
                    <Tooltip content={t('share')}>
                      <Button type="tertiary" onClick={this.handleGroupShare.bind(this, name)} icon={<IconSend />} />
                    </Tooltip>
                    {name !== t('ungrouped') && (
                    <Tooltip content={t('delete')}>
                      <Button type="tertiary" onClick={this.handleGroupDelete.bind(this, name)} icon={<i className="iconfont icon-delete" />} />
                    </Tooltip>
                    )}
                    <Button icon={<IconChevronDown className="collapse-icon" />} type="tertiary" onClick={this.handleCollapse.bind(this, name)} />
                  </ButtonGroup>
                }
              >
                <Table
                  rowKey={V_KEY}
                  dataSource={group.rules}
                  size="small"
                  pagination={false}
                  rowSelection={
                    this.state.isEnableSelect
                      ? {
                        onChange: this.handleSelect,
                        selectedRowKeys: this.state.selectedKeys,
                      }
                      : undefined
                  }
                  columns={[
                    {
                      title: t('enable'),
                      className: 'cell-enable',
                      dataIndex: 'enable',
                      align: 'center',
                      render: (value: boolean, item: InitdRule) => (
                        <Switch size="small" checked={value} onChange={this.handleToggleEnable.bind(this, item)} />
                      ),
                    },
                    {
                      title: t('name'),
                      className: 'cell-name',
                      dataIndex: 'name',
                      render: (value: string, item: InitdRule) => (
                        <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
                          <span>{value}</span>
                        </Popover>
                      ),
                    },
                    {
                      title: t('ruleType'),
                      className: 'cell-type',
                      dataIndex: 'ruleType',
                      render: (value: string) => t(`rule_${value}`),
                    },
                    {
                      title: t('action'),
                      className: 'cell-action',
                      dataIndex: 'action',
                      render: (v, item: InitdRule) => (
                        <Space>
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
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            );
          })}
        </Spin>
        {this.state.float.map((it) => (
          <Float key={it[V_KEY]} rule={it} onClose={() => this.handlePreview(it)} />
        ))}
      </section>
    );
  }
}
