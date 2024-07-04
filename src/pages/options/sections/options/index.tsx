import { Card, List, Select, Switch, Typography } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { defaultPrefValue } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import type { PrefValue } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';

interface OptionsProps {
  visible: boolean;
}

interface OptionsState {
  prefs: PrefValue;
}

const prefItems: {
  [key: string]: { label: string; help: string; type: 'switch' | 'select'; optionList?: Array<{ label: string; value: string }> };
} = {
  'manage-collapse-group': {
    label: t('manage_collapse_group'),
    help: '',
    type: 'switch',
  },
  'exclude-he': {
    label: t('rules_no_effect_for_he'),
    help: '',
    type: 'switch',
  },
  'show-common-header': {
    label: t('display_common_header'),
    help: '',
    type: 'switch',
  },
  'include-headers': {
    label: t('include_header_in_custom_function'),
    help: t('include_header_in_custom_function_help'),
    type: 'switch',
  },
  'modify-body': {
    label: t('modify_body'),
    help: t('modify_body_help'),
    type: 'switch',
  },
  'is-debug': {
    label: t('debug_mode_enable'),
    help: t('debug_mode_enable_help'),
    type: 'switch',
  },
  'rule-switch': {
    label: t('rule_switch'),
    help: t('rule_switch_help'),
    type: 'switch',
  },
  'rule-history': {
    label: t('rule_history'),
    help: t('rule_history_help'),
    type: 'switch',
  },
  'quick-edit': {
    label: t('quick_edit'),
    help: t('quick_edit_help'),
    type: 'switch',
  },
  'dark-mode': {
    label: t('dark_mode'),
    help: t('dark_mode_help'),
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

const style = css`
  width: 800px;
  max-width: 100%;
  margin: 0 auto;
  .semi-card-body {
    padding: 0;
  }
`;

export default class Options extends React.Component<OptionsProps, OptionsState> {
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
        newPrefs[it] = prefs.get(it);
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
      <section className={`section-options ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Card title={t('options')} className={style}>
          <List
            dataSource={allPrefs}
            renderItem={(key) => {
              const item = prefItems[key];
              return (
                <List.Item
                  key={key}
                  main={
                    <div>
                      <Typography.Text strong style={{ display: 'block' }}>{item.label}</Typography.Text>
                      {item.help && <Typography.Text type="quaternary">{item.help}</Typography.Text>}
                    </div>
                  }
                  extra={
                    item.type === 'select' ? (
                      <Select
                        optionList={item.optionList}
                        onChange={(v) => this.handleChange(key, v)}
                        value={this.state.prefs[key]}
                      />
                    ) : (
                      <Switch checked={this.state.prefs[key]} onChange={(v) => this.handleChange(key, Boolean(v))} />
                    )
                  }
                />
              );
            }}
          />
        </Card>
      </section>
    );
  }
}
