/* eslint-disable max-lines */
import { IconCheckList, IconDelete, IconFavoriteList, IconList, IconPlusCircle, IconSend, IconUnlock } from '@douyinfe/semi-icons';
import { Button, ButtonGroup, Modal, Space, Spin, Typography } from '@douyinfe/semi-ui';
import { cx, css } from '@emotion/css';
import * as React from 'react';
import { selectGroup } from '@/pages/options/utils';
import Api from '@/share/pages/api';
import emitter from '@/share/core/emitter';
import notify from '@/share/core/notify';
import { prefs } from '@/share/core/prefs';
import { getVirtualKey, t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { VIRTUAL_KEY, EVENTs, TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import Float from './float';
import RuleGroupCard from './rule-group-card';
import { batchShare, remove } from './utils';

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
    this.handleRuleUpdateEvent = this.handleRuleUpdateEvent.bind(this);
    this.handleRuleDeleteEvent = this.handleRuleDeleteEvent.bind(this);
    this.handleHasRuleUpdate = this.handleHasRuleUpdate.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.handleToggleSelectAll = this.handleToggleSelectAll.bind(this);
    this.handleBatchEnable = this.handleBatchEnable.bind(this);
    this.handleBatchMove = this.handleBatchMove.bind(this);
    this.handleBatchShare = this.handleBatchShare.bind(this);
    this.handleBatchDelete = this.handleBatchDelete.bind(this);
    this.handlePreview = this.handlePreview.bind(this);

    prefs.ready(() => {
      this.isCollapse = prefs.get('manage-collapse-group');
      this.load();
    });
    notify.event.on(EVENTs.RULE_UPDATE, this.handleRuleUpdateEvent);
    notify.event.on(EVENTs.RULE_DELETE, this.handleRuleDeleteEvent);

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
    notify.event.off(EVENTs.RULE_UPDATE, this.handleRuleUpdateEvent);
    notify.event.off(EVENTs.RULE_DELETE, this.handleRuleDeleteEvent);
  }

  // 事件响应 - 通知 - 规则更新
  handleRuleUpdateEvent(request: any) {
    const rule: Rule = request.target;
    // 寻找ID相同的
    let sameItem: Rule | null = null;
    const fromGroupKey = '';
    let fromGroup: Rule[] | null = null;
    let toGroup: Rule[] | null = null;
    const groupKeys = Object.keys(this.state.group);
    for (const key of groupKeys) {
      const group = this.state.group[key];
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
    const displayRule = { ...rule, [VIRTUAL_KEY]: getVirtualKey(rule) };
    // 新的分组
    if (!toGroup) {
      // 插入一个新的Group
      this.state.group[rule.group] = {
        name: rule.group,
        rules: [],
      };
      toGroup = this.state.group[rule.group].rules;
    }
    // 新的规则，直接插入
    if (!sameItem) {
      toGroup.push(displayRule);
    } else if (fromGroup === toGroup) {
      // 在同一个Group里面，直接替换掉就行了
      fromGroup.splice(fromGroup.indexOf(sameItem), 1, displayRule);
    } else {
      // 不同的Group
      if (fromGroup) {
        fromGroup.splice(fromGroup.indexOf(sameItem), 1);
      }
      toGroup.push(displayRule);
    }
    // 分组没了？
    if (fromGroup && fromGroup.length === 0 && fromGroupKey !== t('ungrouped')) {
      delete this.state.group[fromGroupKey];
    }
    this.forceUpdate();
  }

  // 事件响应 - 通知 - 规则删除
  handleRuleDeleteEvent(request: any) {
    const { id } = request;
    const { table } = request;
    const virtualKey = `${table}-${id}`;
    // 寻找key相同的
    let sameItem: Rule | null = null;
    let fromGroupKey = '';
    let fromGroup: Rule[] | null = null;
    const groupKeys = Object.keys(this.state.group);
    for (const key of groupKeys) {
      const group = this.state.group[key];
      const currentRule = group.rules.find((x) => x[VIRTUAL_KEY] === virtualKey);
      if (currentRule) {
        sameItem = currentRule;
        fromGroup = group.rules;
        fromGroupKey = key;
        break;
      }
    }
    if (fromGroup) {
      if (sameItem) {
        fromGroup.splice(fromGroup.indexOf(sameItem), 1);
      }
      // 分组没了？
      if (fromGroup.length === 0 && fromGroupKey !== t('ungrouped')) {
        delete this.state.group[fromGroupKey];
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
    // 通过 VIRTUAL_KEY 筛选出所需要的
    const batch = ([] as Rule[])
      .concat(...Object.values(group).map((it) => it.rules))
      .filter((it) => selectedKeys.includes(it[VIRTUAL_KEY]));
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
          keys.push(it[VIRTUAL_KEY]);
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
    const setTo = !batch[0].enable;
    batch.forEach((rule) => {
      if (rule.enable === setTo) {
        return;
      }
      rule.enable = setTo;
      Api.saveRule(rule);
    });
  }
  // 批量移动群组
  handleBatchMove() {
    selectGroup().then((newGroup) => {
      const batch = this.getSelectedRules().filter((it) => it.group !== newGroup);
      batch.forEach((it) => {
        it.group = newGroup;
        Api.saveRule(it);
      });
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
        batch.forEach((item) => remove(item));
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
    const checkResult = (table: TABLE_NAMES, response: Rule[] | null) => {
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
        item[VIRTUAL_KEY] = getVirtualKey(item);
        result[item.group].rules.push(item);
      });
      // 加载完成啦
      if (++finishCount >= TABLE_NAMES_ARR.length) {
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
    const requestRules = (table: TABLE_NAMES) => {
      setTimeout(() => {
        Api.getRules(table).then((res) => checkResult(table, res));
      });
    };
    TABLE_NAMES_ARR.forEach((table) => requestRules(table));
  }

  render() {
    const { collapsed } = this.state;

    return (
      <section
        className={cx('section-rules', {
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
                <Button theme="light" type="tertiary" onClick={this.handleToggleSelectAll} icon={<IconCheckList />}>
                  {t('select_all')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchEnable} icon={<IconUnlock />}>
                  {t('enable')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchMove} icon={<IconFavoriteList />}>
                  {t('group')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchShare} icon={<IconSend />}>
                  {t('share')}
                </Button>
                <Button theme="light" type="tertiary" onClick={this.handleBatchDelete} icon={<IconDelete />}>
                  {t('delete')}
                </Button>
              </React.Fragment>
              )}
              <Button theme="light" type="tertiary" onClick={this.toggleSelect} icon={<IconList />}>
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
                <RuleGroupCard
                  key={name}
                  name={group.name}
                  collapsed={collapsed.includes(name)}
                  rules={group.rules}
                  isEnableSelect={this.state.isEnableSelect}
                  onSelect={this.handleSelect}
                  selectedKeys={this.state.selectedKeys}
                  onCollapse={() => this.handleCollapse(name)}
                  onRuleEdit={this.props.onEdit}
                  onRulePreview={this.handlePreview}
                />
              );
            })}
          </div>
        </Spin>
        {this.state.float.map((it) => (
          <Float key={it[VIRTUAL_KEY]} rule={it} onClose={() => this.handlePreview(it)} />
        ))}
      </section>
    );
  }
}
