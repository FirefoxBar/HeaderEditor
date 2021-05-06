import { Button, Drawer, Message, Radio, Select, Table } from '@alifd/next';
import { selectGroup } from '@/pages/options/lib/utils';
import * as React from 'react';
import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import { fromJson } from '@/share/core/ruleUtils';
import { t } from '@/share/core/utils';
import { ImportRule, TABLE_NAMES, TinyRule } from '@/share/core/var';
import './index.less';

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

  show(content: { [key: string]: TinyRule[] }) {
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
      TABLE_NAMES.forEach(tableName => {
        if (!list[tableName]) {
          return;
        }
        list[tableName].forEach(e => {
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
    } catch (e) {
      console.error(e);
      return;
    }
  }

  handleConfirm() {
    // 确认导入
    const queue: any[] = [];
    this.state.list.forEach(e => {
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
      Message.success(t('import_success'));
      setTimeout(() => emitter.emit(emitter.EVENT_HAS_RULE_UPDATE), 300);
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

  handleSelectAll() {
    selectGroup(this.state.group).then(group => this.setState({ group }));
  }

  render() {
    return (
      <Drawer
        className="import-drawer"
        placement="left"
        title={t('import')}
        visible={this.state.visible}
        onClose={this.handleCancel}
      >
        <Table dataSource={this.state.list}>
          <Table.Column title={t('name')} dataIndex="name" />
          <Table.Column title={t('ruleType')} dataIndex="ruleType" cell={(value: string) => t(`rule_${value}`)} />
          <Table.Column
            title={t('suggested_group')}
            dataIndex="group"
            cell={(value: string, _i: number, item: ImportRule) => (
              <span>
                <span>{value}</span>
                <Button className="select-group" size="small" onClick={this.handleSelectGroup.bind(this, item)}>
                  {t('choose')}
                </Button>
              </span>
            )}
          />
          <Table.Column
            title={t('action')}
            cell={(_v: any, _i: number, item: ImportRule) => (
              <Select value={item.importAction} onChange={(value: string) => this.handleActionChange(item, value)}>
                <Select.Option value="1">{t('import_new')}</Select.Option>
                {item.importOldId !== -1 && <Select.Option value="2">{t('import_override')}</Select.Option>}
                <Select.Option value="3">{t('import_drop')}</Select.Option>
              </Select>
            )}
          />
        </Table>
        <div className="save-to">
          <span>{t('save_to')}</span>
          <Radio.Group onChange={this.handleRecommendChange} value={this.state.useRecommend}>
            <Radio value={true} label={t('suggested_group')} />
            <Radio value={false}>
              {this.state.group}{' '}
              <Button className="select-group" size="small" onClick={this.handleSelectAll}>
                {t('choose')}
              </Button>
            </Radio>
          </Radio.Group>
        </div>
        <div className="buttons">
          <Button onClick={this.handleConfirm} type="secondary">
            {t('save')}
          </Button>
          <Button onClick={this.handleCancel} type="normal" warning>
            {t('cancel')}
          </Button>
        </div>
      </Drawer>
    );
  }
}
