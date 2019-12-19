import { Dialog, Input, Select } from '@alifd/next';
import * as React from 'react';
import emit from 'share/core/emit';
import { t } from 'share/core/utils';
import './index.less';

interface GroupSelectState {
  group: string[];
  show: boolean;
  selected: string;
  newName: string;
}

export default class GroupSelect extends React.Component<any, GroupSelectState> {
  private newValue = '_new_' + Math.random().toString();

  constructor(props: any) {
    super(props);

    this.handleEventShow = this.handleEventShow.bind(this);
    this.handleEventUpdate = this.handleEventUpdate.bind(this);
    this.handleNew = this.handleNew.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);

    this.state = {
      selected: '',
      group: [],
      show: false,
      newName: '',
    };
  }

  componentDidMount() {
    emit.on(emit.EVENT_GROUP_UPDATE, this.handleEventUpdate);
    emit.on(emit.ACTION_SELECT_GROUP, this.handleEventShow);
  }

  // 分组更新事件
  handleEventUpdate(group: string[]) {
    this.setState({
      group,
    });
  }
  // 显示选择器
  handleEventShow(selected?: string) {
    this.setState({
      show: true,
      selected: selected || '',
    });
  }

  componentWillUnmount() {
    emit.off(emit.EVENT_GROUP_UPDATE, this.handleEventUpdate);
    emit.off(emit.ACTION_SELECT_GROUP, this.handleEventShow);
  }

  handleNew(value: string) {
    this.setState({
      newName: value,
    });
  }

  handleChange(value: string) {
    this.setState({
      selected: value,
    });
  }

  handleSubmit() {
    if (this.state.selected === this.newValue) {
      // 新建不能是空的，如果是的话，就视为取消了
      if (this.state.newName === '') {
        this.handleCancel();
        return;
      }
      const groups = Array.from(this.state.group);
      if (!groups.includes(this.state.newName)) {
        groups.push(this.state.newName);
        emit.emit(emit.EVENT_GROUP_UPDATE, groups);
      }
      emit.emit(emit.INNER_GROUP_SELECTED, this.state.newName);
    } else {
      emit.emit(emit.INNER_GROUP_SELECTED, this.state.selected);
    }
    this.handleCancel();
  }

  handleCancel() {
    this.setState({
      show: false,
      selected: '',
      newName: '',
    });
  }

  render() {
    return (
      <Dialog
        className="group-select-dialog"
        title={t('group')}
        visible={this.state.show}
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
        onClose={this.handleCancel}
      >
        <div>
          <Select value={this.state.selected} onChange={this.handleChange}>
            {this.state.group.map(it => (
              <Select.Option value={it} key={it}>
                {it}
              </Select.Option>
            ))}
            <Select.Option value={this.newValue}>{t('add')}</Select.Option>
          </Select>
        </div>
        {this.state.selected === this.newValue && (
          <div>
            <Input value={this.state.newName} onChange={this.handleNew} />
          </div>
        )}
      </Dialog>
    );
  }
}
