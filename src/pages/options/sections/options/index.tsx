import { Card, Checkbox, Col, Form, Row, Select, Typography } from '@douyinfe/semi-ui';
import * as React from 'react';
import Api from '@/share/pages/api';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/prefs';
import { t } from '@/share/core/utils';
import type { PrefValue } from '@/share/core/types';
import { defaultPrefValue } from '@/share/core/constant';

interface OptionsProps {
  visible: boolean;
}

interface OptionsState {
  prefs: PrefValue;
}

const checkPrefs: { [key: string]: string } = {
  'manage-collapse-group': t('manage_collapse_group'),
  'exclude-he': t('rules_no_effect_for_he'),
  'show-common-header': t('display_common_header'),
  'include-headers': t('include_header_in_custom_function'),
  'modify-body': t('modify_body'),
  'is-debug': t('debug_mode_enable'),
};

interface SelectItem {
  title: string;
  options: Array<{
    label: string;
    value: string;
  }>;
}
const selectPrefs: { [key: string]: SelectItem } = {
  'dark-mode': {
    title: t('dark_mode'),
    options: [
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
        <Card
          title={t('options')}
          footerLine
          footer={
            <div>
              <div><Typography.Text type="tertiary">* {t('dark_mode_help')}</Typography.Text></div>
              <div><Typography.Text type="tertiary">* {t('debug_mode_help')}</Typography.Text></div>
            </div>
          }
        >
          <Row gutter={8}>
            {Object.entries(checkPrefs).map((it) => {
              return (
                <Col xl={12} span={24} key={it[0]} style={{ marginBottom: '8px' }}>
                  <Checkbox
                    onChange={(e) => this.handleChange(it[0], Boolean(e.target.checked))}
                    checked={this.state.prefs[it[0]]}
                  >
                    {it[1]}
                  </Checkbox>
                </Col>
              );
            })}
            {Object.entries(selectPrefs).map((it) => {
              return (
                <Col xl={12} span={24} key={it[0]} style={{ marginBottom: '8px' }}>
                  <Form.Slot label={it[1].title} labelPosition="left">
                    <Select
                      optionList={it[1].options}
                      onChange={(v) => this.handleChange(it[0], v)}
                      value={this.state.prefs[it[0]]}
                    />
                  </Form.Slot>
                </Col>
              );
            })}
          </Row>
        </Card>
      </section>
    );
  }
}
