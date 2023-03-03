import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import { prefs } from '@/share/core/storage';
import { t } from '@/share/core/utils';
import { defaultPrefValue, PrefValue } from '@/share/core/var';
import { Card, Checkbox, Col, Row } from '@douyinfe/semi-ui';
import type { CheckboxEvent } from '@douyinfe/semi-ui/lib/es/checkbox';
import * as React from 'react';

interface OptionsProps {
  visible: boolean;
}

interface OptionsState {
  prefs: PrefValue;
}

const mapPrefToProps: { [key: string]: string } = {
  'manage-collapse-group': t('manage_collapse_group'),
  'exclude-he': t('rules_no_effect_for_he'),
  'add-hot-link': t('add_anti_hot_link_to_menu'),
  'show-common-header': t('display_common_header'),
  'include-headers': t('include_header_in_custom_function'),
  'modify-body': t('modify_body'),
  'is-debug': 'Enable debug',
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

  handleChange(name: string, e: CheckboxEvent) {
    const checked = Boolean(e.target.checked);
    this.setState((prevState) => {
      const newPrefs = { ...prevState.prefs, [name]: checked };
      Api.setPrefs(name, checked);
      prefs.set(name, checked);
      return { prefs: newPrefs };
    });
  }

  render() {
    return (
      <section className={`section-options ${this.props.visible ? 'visible' : 'in-visible'}`}>
        <Card title={t('options')}>
          <Row gutter={8}>
            {Object.entries(mapPrefToProps).map((it) => {
              return (
                <Col xl={12} span={24} key={it[0]} style={{ marginBottom: '8px' }}>
                  <Checkbox
                    onChange={this.handleChange.bind(this, it[0])}
                    checked={this.state.prefs[it[0]]}
                  >
                    {it[1]}
                  </Checkbox>
                </Col>
              );
            })}
          </Row>
        </Card>
      </section>
    );
  }
}
