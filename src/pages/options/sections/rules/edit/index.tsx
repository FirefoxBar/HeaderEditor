import { IconSave } from '@douyinfe/semi-icons';
import { Button, Form, Input, SideSheet, Toast } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import * as React from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import Api from '@/share/pages/api';
import { initRule, isMatchUrl } from '@/share/core/rule-utils';
import { prefs } from '@/share/core/prefs';
import { IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/utils';
import type { InitdRule, Rule } from '@/share/core/types';
import { IS_MATCH, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import { CodeEditorField } from './code-editor';
import ENCODING_LIST from './encoding';
import COMMON_HEADERS from './headers';

interface EditProps {
  visible: boolean;
  rule?: Rule;
  onClose: () => void;
}

interface EditState {
  rule: Rule;
  testUrl: string;
  testResult: string;
}

const formItemLayout = {
  labelCol: {
    fixedSpan: 6,
  },
};

const EMPTY_RULE: Rule = {
  id: -1,
  enable: true,
  group: t('ungrouped'),
  name: '',
  ruleType: RULE_TYPE.CANCEL,
  matchType: RULE_MATCH_TYPE.ALL,
  pattern: '',
  exclude: '',
  isFunction: false,
  code: '',
  action: 'cancel',
};

function getInput(rule: Rule) {
  const res = { ...rule };
  if (
    typeof res.action === 'object' &&
    (res.ruleType === 'modifySendHeader' || res.ruleType === 'modifyReceiveHeader')
  ) {
    res.headerName = res.action.name;
    res.headerValue = res.action.value;
  }
  return res;
}

function getRuleFromInput(input: Rule): Rule {
  const res = { ...input };
  if (res.ruleType === 'modifySendHeader' || res.ruleType === 'modifyReceiveHeader') {
    res.action = {
      name: res.headerName,
      value: res.headerValue,
    };
    delete res.headerName;
    delete res.headerValue;
  }
  return res;
}

export default class Edit extends React.Component<EditProps, EditState> {
  private initedRule?: InitdRule;
  private formApi: FormApi | null = null;
  constructor(props: any) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTestChange = this.handleTestChange.bind(this);

    this.state = {
      rule: getInput(EMPTY_RULE),
      testUrl: '',
      testResult: '',
    };
  }

  get isEdit() {
    return !!this.props.rule;
  }

  handleChange(_: any, item: any) {
    // console.log('handleChange', item);
    this.setState((prevState) => {
      const rule = { ...prevState.rule };
      Object.keys(item).forEach((k) => {
        rule[k] = item[k];
      });
      if (item.name === 'ruleType' && item.value === 'modifyReceiveBody') {
        rule.isFunction = true;
      }

      return { rule };
    },
    () => {
      this.getTestResult(true);
    });
  }

  handleTestChange(value: string) {
    this.setState(
      {
        testUrl: value,
      },
      () => {
        this.getTestResult();
      },
    );
  }

  getTestResult(reInit = false) {
    if (this.state.testUrl !== '') {
      // 初始化
      if (reInit || !this.initedRule) {
        try {
          this.initedRule = initRule(this.state.rule);
        } catch (e) {
          // 出错
          this.setState({
            testUrl: e.message,
          });
        }
      }
      // 运行
      if (this.initedRule) {
        const match = isMatchUrl(this.initedRule, this.state.testUrl);
        const resultText: { [x: number]: string } = {
          [IS_MATCH.NOT_MATCH]: t('test_mismatch'),
          [IS_MATCH.MATCH_BUT_EXCLUDE]: t('test_exclude'),
        };
        if (typeof resultText[match] !== 'undefined') {
          this.setState({
            testResult: resultText[match],
          });
          return;
        }
        // 匹配通过，实际运行
        if (this.initedRule.isFunction) {
          this.setState({
            testResult: t('test_custom_code'),
          });
          return;
        }
        // 只有重定向支持测试详细功能，其他只返回匹配
        if (this.initedRule.ruleType === 'redirect' && this.initedRule.to) {
          let redirect = '';
          if (this.initedRule.matchType === 'regexp') {
            redirect = this.state.testUrl.replace(this.initedRule._reg, this.initedRule.to);
          } else {
            redirect = this.initedRule.to;
          }
          if (/^(http|https|ftp|file)%3A/.test(redirect)) {
            redirect = decodeURIComponent(redirect);
          }
          this.setState({
            testResult: redirect,
          });
        } else {
          this.setState({
            testResult: 'Matched',
          });
        }
      }
    }
  }

  componentDidUpdate(prevProps: EditProps) {
    if (this.props.visible !== prevProps.visible) {
      this.setState({
        testUrl: '',
        testResult: '',
      });
      if (!this.props.visible) {
        this.formApi = null;
      }
    }
    if (this.props.rule !== prevProps.rule) {
      const newRule = getInput(this.props.rule ? this.props.rule : EMPTY_RULE);
      this.setState({
        rule: newRule,
      }, () => {
        this.formApi?.reset();
        this.formApi?.setValues(newRule);
      });
    }
  }

  async handleSubmit() {
    const rule = getRuleFromInput(this.state.rule);
    // 常规检查
    if (rule.name === '') {
      Toast.error(t('name_empty'));
      return;
    }
    if (rule.matchType !== 'all' && rule.matchRule === '') {
      Toast.error(t('match_rule_empty'));
      return;
    }
    if (rule.ruleType !== 'modifyReceiveBody' && !rule.encoding) {
      rule.encoding = 'UTF-8';
    }

    if (rule.isFunction && rule.code === '') {
      Toast.error(t('code_empty'));
      return;
    }
    if (rule.ruleType === 'redirect' && (!rule.to || rule.to === '')) {
      Toast.error(t('redirect_empty'));
      return;
    }
    if (
      (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') &&
      (typeof rule.action !== 'object' || rule.action.name === '')
    ) {
      Toast.error(t('header_empty'));
      return;
    }

    // 检查是否有开启
    if (rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
      if (!prefs.get('modify-body')) {
        prefs.set('modify-body', true);
        Toast.info('已自动开启选项 - 修改响应体，若不需要请手动关闭');
      }
    }

    const res = await Api.saveRule(rule);
    this.props.onClose();
  }

  render() {
    const isHeaderSend = this.state.rule.ruleType === 'modifySendHeader';
    const isHeaderReceive = this.state.rule.ruleType === 'modifyReceiveHeader';
    const isHeader = isHeaderSend || isHeaderReceive;
    return (
      <SideSheet
        placement="right"
        visible={this.props.visible}
        onCancel={this.props.onClose}
        title={this.isEdit ? t('edit') : t('add')}
        keepDOM={false}
        width="100vw"
        className={css`
          .semi-sidesheet-inner {
            width: 100vw;
            max-width: 800px;
          }
        `}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button theme="solid" onClick={this.handleSubmit} icon={<IconSave />}>{t('save')}</Button>
          </div>
        }
      >
        <Form
          {...formItemLayout}
          getFormApi={(api) => this.formApi = api}
          initValues={this.state.rule}
          onValueChange={this.handleChange}
          labelPosition="left"
          labelAlign="right"
          labelWidth={140}
        >
          <Form.Input field="name" label={t('name')} />
          <Form.Select
            label={t('ruleType')}
            field="ruleType"
            disabled={this.isEdit}
            optionList={[
              { label: t('rule_cancel'), value: 'cancel' },
              { label: t('rule_redirect'), value: 'redirect' },
              { label: t('rule_modifySendHeader'), value: 'modifySendHeader' },
              { label: t('rule_modifyReceiveHeader'), value: 'modifyReceiveHeader' },
              { label: t('rule_modifyReceiveBody'), value: 'modifyReceiveBody', disabled: !IS_SUPPORT_STREAM_FILTER },
            ]}
          />
          <Form.Select
            label={t('matchType')}
            field="matchType"
            optionList={[
              { label: t('match_all'), value: 'all' },
              { label: t('match_regexp'), value: 'regexp' },
              { label: t('match_prefix'), value: 'prefix' },
              { label: t('match_domain'), value: 'domain' },
              { label: t('match_url'), value: 'url' },
            ]}
          />
          {this.state.rule.matchType !== 'all' && (
            <Form.Input label={t('matchRule')} field="pattern" />
          )}
          <Form.Input label={t('excludeRule')} field="exclude" />
          {/* Response body encoding */}
          {this.state.rule.ruleType === 'modifyReceiveBody' && (
            <Form.Select filter field="encoding" label={t('encoding')} optionList={ENCODING_LIST.map((x) => ({ label: x, value: x }))} />
          )}
          {/* isFunction or not */}
          <BoolRadioGroupField
            label={t('exec_type')}
            field="isFunction"
            options={[
              { label: t('exec_normal'), value: false },
              { label: t('exec_function'), value: true },
            ]}
          />
          {/* Redirect */}
          {this.state.rule.ruleType === 'redirect' && !this.state.rule.isFunction && (
            <Form.Input label={t('redirectTo')} field="to" />
          )}
          {/* Header modify */}
          {isHeader && !this.state.rule.isFunction && (
            <Form.Select
              filter
              field="headerName"
              label={t('headerName')}
              optionList={(isHeaderSend ? COMMON_HEADERS.request : COMMON_HEADERS.response).map((x) => ({ label: x, value: x }))}
            />
          )}
          {isHeader && !this.state.rule.isFunction && (
            <Form.Input label={t('headerValue')} field="headerValue" />
          )}
          {/* Custom function */}
          {this.state.rule.isFunction && (
            <CodeEditorField field="code" label={t('code')} height="200px" />
          )}
          <Form.Slot label={t('test_url')}>
            <Input value={this.state.testUrl} onChange={this.handleTestChange} />
          </Form.Slot>
          <Form.Slot label=" ">
            <pre>{this.state.testResult}</pre>
          </Form.Slot>
        </Form>
      </SideSheet>
    );
  }
}
