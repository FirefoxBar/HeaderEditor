import * as React from 'react';
import { Input, Modal, Select } from '@douyinfe/semi-ui';
import emitter from '@/share/core/emitter';
import { t } from '@/share/core/utils';

interface GroupSelectState {
  group: string[];
  show: boolean;
  selected: string;
  newName: string;
}

export default class GroupSelect extends React.Component<any, GroupSelectState> {
  private newValue = `_new_${Math.random().toString()}`;

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
    emitter.on(emitter.EVENT_GROUP_UPDATE, this.handleEventUpdate);
    emitter.on(emitter.ACTION_SELECT_GROUP, this.handleEventShow);
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
    emitter.off(emitter.EVENT_GROUP_UPDATE, this.handleEventUpdate);
    emitter.off(emitter.ACTION_SELECT_GROUP, this.handleEventShow);
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
        emitter.emit(emitter.EVENT_GROUP_UPDATE, groups);
      }
      emitter.emit(emitter.INNER_GROUP_SELECTED, this.state.newName);
    } else {
      emitter.emit(emitter.INNER_GROUP_SELECTED, this.state.selected);
    }
    this.handleCancel();
  }

  handleCancel() {
    this.setState({
      show: false,
      selected: '',
      newName: '',
    });
    // 触发一个失败事件，让emitter去掉监听
    emitter.emit(emitter.INNER_GROUP_CANCEL);
  }

  render() {
    return (
      <Modal
        className="group-select-dialog"
        title={t('group')}
        visible={this.state.show}
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <div>
          <Select
            value={this.state.selected}
            onChange={this.handleChange}
            optionList={[
              ...this.state.group.map((x) => ({ label: x, value: x })),
              { label: t('add'), value: this.newValue },
            ]}
          />
        </div>
        {this.state.selected === this.newValue && (
          <div style={{ marginTop: '12px' }}>
            <Input value={this.state.newName} onChange={this.handleNew} />
          </div>
        )}
      </Modal>
    );
  }
}
