import * as React from 'react';
import { SideSheet, Button, Table, Select, Toast } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { IconSave } from '@douyinfe/semi-icons';
import { selectGroup } from '@/pages/options/utils';
import Api from '@/share/pages/api';
import { fromJson } from '@/share/core/rule-utils';
import { t } from '@/share/core/utils';
import type { ImportRule, BasicRule } from '@/share/core/types';
import BoolRadioGroup from '@/pages/options/components/bool-radio';
import { TABLE_NAMES_ARR } from '@/share/core/constant';

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

export default class ImportDrawer extends React.Component<ImportDrawerProps, ImportDrawerState> {
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

  show(content: { [key: string]: BasicRule[] }) {
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
      TABLE_NAMES_ARR.forEach((tableName) => {
        if (!list[tableName]) {
          return;
        }
        list[tableName].forEach((e) => {
          totalCount++;
          Api.getRules(tableName, { name: e.name }).then((rule) => {
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
    } catch (e) {
      console.error(e);
    }
  }

  handleConfirm() {
    // 确认导入
    const queue: any[] = [];
    this.state.list.forEach((e: BasicRule) => {
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
      queue.push(Api.saveRule(e));
    });
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
    selectGroup(item.group).then((res) => {
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button type="tertiary" theme="light" onClick={this.handleCancel}>
              {t('cancel')}
            </Button>
            <Button type="primary" theme="solid" onClick={this.handleConfirm} icon={<IconSave />}>
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
                  <Button className="select-group" size="small" onClick={this.handleSelectGroup.bind(this, item)}>
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
                  onChange={(value: string) => this.handleActionChange(item, value)}
                  optionList={[
                    { label: t('import_new'), value: 1 },
                    { label: t('import_override'), value: 2, disabled: item.importOldId === -1 },
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
                    <Button className="select-group" size="small" onClick={this.handleSelectAll}>
                      {t('choose')}
                    </Button>
                  </span>),
                value: false,
              },
            ]}
          />
        </div>
      </SideSheet>
    );
  }
}
