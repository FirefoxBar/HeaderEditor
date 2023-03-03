import Api from '@/share/core/api';
import { prefs } from '@/share/core/storage';
import { t } from '@/share/core/utils';
import '@/share/global.less';
import { Button, Switch } from '@alifd/next';
import * as React from 'react';
import browser from 'webextension-polyfill';
import './index.less';

interface PopupState {
  enable: boolean;
}
export default class Popup extends React.Component<any, PopupState> {
  constructor(props: any) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      enable: true,
    };
  }

  componentDidMount() {
    prefs.ready(() => {
      this.setState({
        enable: !prefs.get('disable-all'),
      });
    });
  }

  handleChange(checked: boolean) {
    this.setState({
      enable: checked,
    });
    Api.setPrefs('disable-all', !checked);
  }

  handleOpen() {
    Api.openURL(browser.runtime.getURL('options.html'));
    window.close();
  }

  render() {
    return (
      <div className="page-popup">
        <div className="switcher">
          <Switch checked={this.state.enable} onChange={this.handleChange} size="small" />
          <span>{t('enable_he')}</span>
        </div>
        <div>
          <Button onClick={this.handleOpen} type="secondary">
            {t('manage')}
          </Button>
        </div>
      </div>
    );
  }
}
