import { IconSave } from '@douyinfe/semi-icons';
import {
  Button,
  Select,
  SideSheet,
  Space,
  Table,
  Tag,
  Toast,
} from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { nanoid } from 'nanoid';
import * as React from 'react';
import { selectGroup } from '@/pages/options/utils';
import BoolRadioGroup from '@/share/components/bool-radio';
import { type RULE_TYPE, TABLE_NAMES_ARR } from '@/share/core/constant';
import { fromJson } from '@/share/core/rule-utils';
import { collectRuleUsedTasks } from '@/share/core/tasks';
import type { BasicRule, Rule, Task } from '@/share/core/types';
import { getTableName, t } from '@/share/core/utils';
import Api from '@/share/pages/api';

interface ImportDrawerProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

enum IMPORT_ACTION {
  NEW = 'new',
  OVERRIDE = 'override',
  DROP = 'drop',
}

interface ImportRuleInfo {
  id: string;
  name: string;
  oldId?: number;
  type: RULE_TYPE;
  group: string;
  tasks: Set<string>;
  action: IMPORT_ACTION;
}

interface ImportTaskInfo {
  key: string;
  name: string;
  exists: boolean;
  action: IMPORT_ACTION;
}

interface ImportDrawerState {
  visible: boolean;
  group: string;
  loading: boolean;
  rules: Array<ImportRuleInfo>;
  tasks: Array<ImportTaskInfo>;
  useRecommend: boolean;
}

export default class ImportDrawer extends React.Component<
  ImportDrawerProps,
  ImportDrawerState
> {
  tasks: Record<string, Task>;
  rules: Record<string, BasicRule>;

  constructor(props: any) {
    super(props);

    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleRecommendChange = this.handleRecommendChange.bind(this);

    this.rules = {};
    this.tasks = {};

    this.state = {
      visible: false,
      useRecommend: true,
      loading: false,
      group: '',
      rules: [],
      tasks: [],
    };
  }

  show(content: any) {
    this.rules = {};
    this.tasks = {};
    this.setState({
      group: t('ungrouped'),
      useRecommend: true,
      visible: true,
      loading: true,
    });
    const ruleInfos: ImportRuleInfo[] = [];
    const taskInfos: ImportTaskInfo[] = [];
    const queue: Promise<void>[] = [];

    // process rules
    const initOneRule = async (r: Rule) => {
      const existsRule = await Api.getRules(getTableName(r.ruleType), {
        name: r.name,
      });
      const hasRule = existsRule.length > 0;
      const basicInfo: ImportRuleInfo = {
        id: nanoid(),
        name: r.name,
        type: r.ruleType,
        group: r.group || t('ungrouped'),
        tasks: collectRuleUsedTasks(r),
        action: hasRule ? IMPORT_ACTION.OVERRIDE : IMPORT_ACTION.NEW,
      };
      if (hasRule) {
        basicInfo.oldId = existsRule[0].id;
      }
      this.rules[basicInfo.id] = r;
      ruleInfos.push(basicInfo);
    };
    const list = typeof content === 'string' ? fromJson(content) : content;
    TABLE_NAMES_ARR.forEach(tableName => {
      if (!list[tableName]) {
        return;
      }
      list[tableName].forEach((e: Rule) => {
        queue.push(initOneRule(e));
      });
    });

    // process tasks
    const initOneTask = async (t: Task) => {
      const existsTask = await Api.getTask(t.key);
      taskInfos.push({
        key: t.key,
        name: t.name,
        exists: Boolean(existsTask),
        action: IMPORT_ACTION.NEW,
      });
    };
    if (content.tasks) {
      this.tasks = content.tasks;
      Object.keys(content.tasks).forEach(taskKey =>
        queue.push(initOneTask(content.tasks[taskKey])),
      );
    }

    Promise.all(queue).then(() => {
      this.setState({
        loading: false,
        tasks: taskInfos,
        rules: ruleInfos,
      });
    });
  }

  async handleConfirm() {
    this.setState({
      loading: true,
    });
    // 确认导入
    const queue: Promise<void>[] = [];

    // 处理 task 导入
    const taskKeyAlias = new Map<string, string>();
    const allTasks = await Api.getTasks();
    const taskKeys = allTasks.map(x => x.key);
    this.state.tasks.forEach(e => {
      const task = this.tasks[e.key];
      if (!task || e.action === IMPORT_ACTION.DROP) {
        return;
      }
      if (e.exists && e.action === IMPORT_ACTION.NEW) {
        while (taskKeys.includes(task.key)) {
          const newKey = `${task.key}_${nanoid()}`;
          taskKeyAlias.set(task.key, newKey);
          task.key = newKey;
          taskKeys.push(newKey);
        }
      }
      queue.push(Api.saveTask(task));
    });

    // 处理 rule 导入
    const replaceTaskKeys = (s: string) => {
      let res = s;
      taskKeyAlias.forEach((value, key) => {
        res = res.replaceAll(`{\$TASK.${key}.}`, `{\$TASK.${value}.}`);
      });
      return res;
    };
    this.state.rules.forEach(e => {
      const rule = this.rules[e.id];
      // 不导入
      if (e.action === IMPORT_ACTION.DROP || !rule) {
        return;
      }
      if (e.action === IMPORT_ACTION.OVERRIDE) {
        (rule as Rule).id = e.oldId!;
      } else {
        delete (rule as any).id;
      }
      if (!this.state.useRecommend) {
        e.group = this.state.group;
      }
      if (typeof rule.enable === 'undefined') {
        rule.enable = true;
      }

      if (rule.isFunction && rule.code) {
        ['get', 'getLastRun', 'getValidRun'].forEach(func => {
          const regex = new RegExp(
            `task\.${func}\\s*\\(\\s*['"]?([^'"]+)['"]?\\s*\\)`,
          );
          rule.code = rule.code.replaceAll(regex, (fullText, taskKey) =>
            taskKeyAlias.has(taskKey)
              ? `task.${func}('${taskKeyAlias.get(taskKey)}')`
              : fullText,
          );
        });
      }
      if (rule.headers) {
        Object.keys(rule.headers).forEach(key => {
          rule.headers![key] = replaceTaskKeys(rule.headers![key]);
        });
      }
      if (rule.to) {
        rule.to = replaceTaskKeys(rule.to);
      }
      if (rule.body?.value) {
        rule.body.value = replaceTaskKeys(rule.body.value);
      }
      queue.push(Api.saveRule(rule));
    });

    await Promise.all(queue);
    // this.imports.status = 0;
    Toast.success(t('import_success'));
    this.props.onSuccess?.();

    this.tasks = {};
    this.rules = {};
    this.setState({
      loading: false,
      tasks: [],
      rules: [],
      visible: false,
    });
  }

  handleCancel() {
    this.tasks = {};
    this.rules = {};
    this.setState({
      loading: false,
      tasks: [],
      rules: [],
      visible: false,
    });
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  handleActionChange(item: ImportRuleInfo | ImportTaskInfo, to: IMPORT_ACTION) {
    item.action = to;
    this.forceUpdate();
  }

  handleSelectGroup(item: ImportRuleInfo) {
    selectGroup(item.group).then(res => {
      item.group = res;
      this.forceUpdate();
    });
  }

  handleRecommendChange(value: any) {
    this.setState({
      useRecommend: !!value,
    });
  }

  async handleSelectAll() {
    const group = await selectGroup(this.state.group);
    this.setState({
      useRecommend: false,
      group,
    });
  }

  render() {
    return (
      <SideSheet
        placement="right"
        visible={this.state.visible}
        onCancel={this.handleCancel}
        title={t('import')}
        width="100vw"
        className={css`
          .semi-sidesheet-inner {
            width: 100vw;
            max-width: 800px;
          }
        `}
        footer={
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
          >
            <Button type="tertiary" theme="light" onClick={this.handleCancel}>
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              theme="solid"
              onClick={this.handleConfirm}
              icon={<IconSave />}
            >
              {t('save')}
            </Button>
          </div>
        }
      >
        <Table
          dataSource={this.state.rules}
          pagination={false}
          loading={this.state.loading}
          columns={[
            {
              title: t('name'),
              dataIndex: 'name',
            },
            {
              title: t('ruleType'),
              dataIndex: 'ruleType',
              render: (value: string) => t(`rule_${value}`),
            },
            {
              title: t('suggested_group'),
              dataIndex: 'group',
              render: (value: string, item: ImportRuleInfo) => (
                <span>
                  <span>{value}</span>
                  &nbsp;
                  <Button
                    className="select-group"
                    size="small"
                    onClick={this.handleSelectGroup.bind(this, item)}
                  >
                    {t('choose')}
                  </Button>
                </span>
              ),
            },
            {
              title: '任务',
              dataIndex: 'tasks',
              render: (tasks: Set<string>) => (
                <Space>
                  {Array.from(tasks).map(x => (
                    <Tag color="grey" key={x}>
                      {x}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: t('action'),
              render: (_v: any, item: ImportRuleInfo) => (
                <Select
                  value={item.action}
                  onChange={value =>
                    this.handleActionChange(item, value as IMPORT_ACTION)
                  }
                  optionList={[
                    { label: t('import_new'), value: IMPORT_ACTION.NEW },
                    {
                      label: t('import_override'),
                      value: IMPORT_ACTION.OVERRIDE,
                      disabled: !item.oldId,
                    },
                    { label: t('import_drop'), value: IMPORT_ACTION.DROP },
                  ]}
                />
              ),
            },
          ]}
        />
        <Table
          dataSource={this.state.tasks}
          pagination={false}
          loading={this.state.loading}
          columns={[
            {
              title: t('name'),
              dataIndex: 'name',
            },
            {
              title: t('action'),
              render: (_v: any, item: ImportTaskInfo) => (
                <Select
                  value={item.action}
                  onChange={value =>
                    this.handleActionChange(item, value as IMPORT_ACTION)
                  }
                  optionList={[
                    { label: t('import_new'), value: IMPORT_ACTION.NEW },
                    {
                      label: t('import_override'),
                      value: IMPORT_ACTION.OVERRIDE,
                      disabled: !item.exists,
                    },
                    { label: t('import_drop'), value: IMPORT_ACTION.DROP },
                  ]}
                />
              ),
            },
          ]}
        />
        <div
          className={css`
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-top: 8px;
            gap: 8px;
            .semi-radio-content {
              display: flex;
              flex-direction: row;
              align-items: center;
            }
          `}
        >
          <span>{t('save_to')}</span>
          <BoolRadioGroup
            onChange={this.handleRecommendChange}
            value={this.state.useRecommend}
            options={[
              { label: t('suggested_group'), value: true },
              {
                label: (
                  <span>
                    <span>{this.state.group}</span>
                    &nbsp;
                    <Button
                      className="select-group"
                      size="small"
                      onClick={this.handleSelectAll}
                    >
                      {t('choose')}
                    </Button>
                  </span>
                ),
                value: false,
              },
            ]}
          />
        </div>
      </SideSheet>
    );
  }
}
