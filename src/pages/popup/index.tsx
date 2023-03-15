import SemiLocale from '@/share/components/semi-locale';
import Api from '@/share/core/api';
import { prefs } from '@/share/core/storage';
import { IS_ANDROID, t } from '@/share/core/utils';
import '@/share/global.less';
import { Button, Switch } from '@douyinfe/semi-ui';
import { css, cx } from '@emotion/css';
import * as React from 'react';
import browser from 'webextension-polyfill';

interface PopupState {
  enable: boolean;
}

const basicStyle = css`
  min-height: 90px;
  min-width: 260px;
  max-width: 400px;
  padding: 15px 17px;
  box-sizing: border-box;

  .switcher {
    padding-bottom: 10px;

    > * {
      vertical-align: middle;
    }

    span {
      font-size: 14px;
      padding-left: 5px;
    }
  }

  .semi-button {
    width: 100%;
  }
`;

const mobileStyle = css`
  height: 100vh;
  width: 100vw;
`;

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
      // Get dark mode setting
      const darkMode = prefs.get('dark-mode');
      switch (darkMode) {
        case 'auto':
          try {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            mql.addListener(e => {
              if (e.matches) {
                document.body.setAttribute('theme-mode', 'dark');
                document.body.style.backgroundColor = '#000';
              }
            });
          } catch (e) {
            // ignore
          }
          break;
        case 'on':
          document.body.setAttribute('theme-mode', 'dark');
          document.body.style.backgroundColor = '#000';
          break;
        default:
          return;
      }
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
      <SemiLocale>
        <div
          className={cx(basicStyle, {
            [mobileStyle]: IS_ANDROID,
          })}
        >
          <div className="switcher">
            <Switch checked={this.state.enable} onChange={this.handleChange} size="small" />
            <Typography.Text>{t('enable_he')}</Typography.Text>
          </div>
          <div>
            <Button onClick={this.handleOpen} type="secondary">
              {t('manage')}
            </Button>
          </div>
        </div>
      </SemiLocale>
    );
  }
}
