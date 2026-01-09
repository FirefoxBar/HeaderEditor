import { IconSave } from '@douyinfe/semi-icons';
import { Button, Select, SideSheet, Table, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import * as React from 'react';
import { selectGroup } from '@/pages/options/utils';
import BoolRadioGroup from '@/share/components/bool-radio';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import { fromJson } from '@/share/core/rule-utils';
import { getRuleUsedTasks } from '@/share/core/tasks';
import type { BasicRule, ImportRule, Rule, Task } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';

interface ImportDrawerProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface ImportDrawerState {
  visible: boolean;
  group: string;
  list: ImportRule[];
  useRecommend: boolean;
}

export default class ImportDrawer extends React.Component<
  ImportDrawerProps,
  ImportDrawerState
> {
  tasks?: Record<string, Task>;

  constructor(props: any) {
    super(props);

    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleRecommendChange = this.handleRecommendChange.bind(this);

    this.state = {
      visible: false,
      list: [],
      useRecommend: true,
      group: '',
    };
  }

  show(content: any) {
    this.setState({
      ...this.state,
      list: [],
      group: t('ungrouped'),
      useRecommend: true,
    });
    try {
      let totalCount = 0;
      const importList: ImportRule[] = [];
      const list = typeof content === 'string' ? fromJson(content) : content;
      TABLE_NAMES_ARR.forEach(tableName => {
        if (!list[tableName]) {
          return;
        }
        list[tableName].forEach((e: Rule) => {
          totalCount++;
          Api.getRules(tableName, { name: e.name }).then(rule => {
            const it: ImportRule = {
              ...e,
              group: e.group || t('ungrouped'),
              id: Math.random(),
              importAction: rule && rule.length ? 2 : 1,
              importOldId: rule && rule.length ? rule[0].id : -1,
            };
            importList.push(it);
            // 检查是否已经全部完成了
            if (totalCount === importList.length) {
              this.setState({
                ...this.state,
                visible: true,
                list: importList,
              });
            }
          });
        });
      });
      if (content.tasks) {
        this.tasks = content.tasks;
      }
    } catch (e) {
      console.error(e);
    }
  }

  handleConfirm() {
    // 确认导入
    const queue: any[] = [];
    const tasks = new Set<string>();
    this.state.list.forEach((e: any) => {
      // 不导入
      if (e.importAction === 3) {
        return;
      }
      if (e.importAction === 2) {
        e.id = e.importOldId;
      } else {
        delete e.id;
      }
      delete e.importAction;
      delete e.importOldId;
      if (!this.state.useRecommend) {
        e.group = this.state.group;
      }
      if (typeof e.enable === 'undefined') {
        e.enable = true;
      }
      getRuleUsedTasks(e).forEach(task => tasks.add(task));
      queue.push(Api.saveRule(e));
    });
    // 处理 task 导入
    if (tasks.size > 0) {
      Array.from(tasks)
        .map(x => this.tasks?.[x])
        .forEach(t => queue.push(t ? Api.saveTask(t) : Promise.resolve()));
    }
    Promise.all(queue).then(() => {
      // this.imports.status = 0;
      Toast.success(t('import_success'));
      this.props.onSuccess?.();
    });
    this.setState({
      list: [],
      visible: false,
    });
  }

  handleCancel() {
    this.setState({
      list: [],
      visible: false,
    });
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  handleActionChange(item: ImportRule, to: string) {
    item.importAction = parseInt(to, 10);
    this.forceUpdate();
  }

  handleSelectGroup(item: ImportRule) {
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
          dataSource={this.state.list}
          pagination={false}
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
              render: (value: string, item: ImportRule) => (
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
              title: t('action'),
              render: (_v: any, item: ImportRule) => (
                <Select
                  value={item.importAction}
                  onChange={value =>
                    this.handleActionChange(item, value as string)
                  }
                  optionList={[
                    { label: t('import_new'), value: 1 },
                    {
                      label: t('import_override'),
                      value: 2,
                      disabled: item.importOldId === -1,
                    },
                    { label: t('import_drop'), value: 3 },
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
