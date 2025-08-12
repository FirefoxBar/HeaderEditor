import { List, Select, Switch, Typography } from '@douyinfe/semi-ui';
import React from 'react';
import { defaultPrefValue } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import type { PrefValue } from '@/share/core/types';
import { IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/utils';
import Api from '@/share/pages/api';

interface PrefsState {
  prefs: PrefValue;
}

const prefItems: {
  [key: string]: {
    langKey: string;
    type: 'switch' | 'select';
    optionList?: Array<{ label: string; value: string }>;
    disabled?: boolean;
  };
} = {
  'manage-collapse-group': {
    langKey: 'manage_collapse_group',
    type: 'switch',
  },
  'show-common-header': {
    langKey: 'display_common_header',
    type: 'switch',
  },
  'include-headers': {
    langKey: 'include_header_in_custom_function',
    type: 'switch',
    disabled: !ENABLE_EVAL,
  },
  'modify-body': {
    langKey: 'modify_body',
    type: 'switch',
    disabled: !IS_SUPPORT_STREAM_FILTER,
  },
  'is-debug': {
    langKey: 'debug_mode_enable',
    type: 'switch',
  },
  'rule-switch': {
    langKey: 'rule_switch',
    type: 'switch',
  },
  'rule-history': {
    langKey: 'rule_history',
    type: 'switch',
  },
  'quick-edit': {
    langKey: 'quick_edit',
    type: 'switch',
  },
  'dark-mode': {
    langKey: 'dark_mode',
    type: 'select',
    optionList: [
      {
        label: t('auto'),
        value: 'auto',
      },
      {
        label: t('enable'),
        value: 'on',
      },
      {
        label: t('disable'),
        value: 'off',
      },
    ],
  },
};

const allPrefs = Object.keys(prefItems);

export default class Prefs extends React.Component<{}, PrefsState> {
  constructor(props: any) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);

    this.state = {
      prefs: { ...defaultPrefValue },
    };
  }

  componentDidMount() {
    prefs.ready(() => {
      const newPrefs = { ...this.state.prefs };
      Object.keys(newPrefs).forEach((it) => {
        newPrefs[it] = prefs.get(it as keyof PrefValue);
      });
      this.setState({
        prefs: newPrefs,
      });
    });
    emitter.on(emitter.EVENT_PREFS_UPDATE, this.handleUpdate);
  }

  componentWillUnmount() {
    emitter.off(emitter.EVENT_PREFS_UPDATE, this.handleUpdate);
  }

  handleUpdate(key: string, val: any) {
    if (this.state.prefs[key] === val) {
      return;
    }
    this.setState((prevState) => ({
      prefs: {
        ...prevState.prefs,
        [key]: val,
      },
    }));
  }

  handleChange(name: string, value: any) {
    this.setState((prevState) => {
      const newPrefs = { ...prevState.prefs, [name]: value };
      Api.setPrefs(name, value);
      prefs.set(name, value);
      return { prefs: newPrefs };
    });
  }

  render() {
    return (
      <List
        dataSource={allPrefs}
        renderItem={(key) => {
          const item = prefItems[key];
          const label = t(item.langKey);
          const help = t(`${item.langKey}_help`, undefined, '');
          return (
            <List.Item
              key={key}
              main={
                <div className="list-item">
                  <Typography.Text className="title">
                    {label}
                  </Typography.Text>
                  {help && (
                    <Typography.Text type="quaternary" className="content">
                      {help}
                    </Typography.Text>
                  )}
                </div>
              }
              extra={
                item.type === 'select' ? (
                  <Select
                    optionList={item.optionList}
                    onChange={(v) => this.handleChange(key, v)}
                    value={this.state.prefs[key]}
                    disabled={item.disabled}
                  />
                ) : (
                  <Switch
                    checked={this.state.prefs[key]}
                    onChange={(v) => this.handleChange(key, Boolean(v))}
                    disabled={item.disabled}
                  />
                )
              }
            />
          );
        }}
      />
    );
  }
}
