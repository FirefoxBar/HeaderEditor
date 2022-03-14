import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import { initRule, isMatchUrl } from '@/share/core/ruleUtils';
import { prefs } from '@/share/core/storage';
import { IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/utils';
import { InitdRule, IS_MATCH, Rule, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/var';
import { Drawer, Form, Input, Message, Radio, Select } from '@alifd/next';
import { highlight, languages } from 'prismjs';
import * as React from 'react';
import Editor from 'react-simple-code-editor';
import ENCODING_LIST from './encoding';
import COMMON_HEADERS from './headers';
import './index.less';

// 保持在最后，顺序不能乱
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

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
    const rule = {
      ...this.state.rule,
      [item.name]: item.value,
    };
    if (item.name === 'ruleType' && item.value === 'modifyReceiveBody') {
      rule.isFunction = true;
    }
    this.setState(
      {
        rule,
      },
      () => {
        this.getTestResult(true);
      },
    );
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
    if (this.props.rule !== prevProps.rule) {
      this.setState({
        rule: getInput(this.props.rule ? this.props.rule : EMPTY_RULE),
      });
    }
    if (this.props.visible !== prevProps.visible) {
      this.setState({
        testUrl: '',
        testResult: '',
      });
    }
  }

  async handleSubmit() {
    const rule = getRuleFromInput(this.state.rule);
    // 常规检查
    if (rule.name === '') {
      Message.error(t('name_empty'));
      return;
    }
    if (rule.matchType !== 'all' && rule.matchRule === '') {
      Message.error(t('match_rule_empty'));
      return;
    }
    if (rule.ruleType !== 'modifyReceiveBody' && !rule.encoding) {
      rule.encoding = 'UTF-8';
    }

    if (rule.isFunction && rule.code === '') {
      Message.error(t('code_empty'));
      return;
    }
    if (rule.ruleType === 'redirect' && (!rule.to || rule.to === '')) {
      Message.error(t('redirect_empty'));
      return;
    }
    if (
      (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') &&
      (typeof rule.action !== 'object' || rule.action.name === '')
    ) {
      Message.error(t('header_empty'));
      return;
    }

    // 检查是否有开启
    if (rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
      if (!prefs.get('modify-body')) {
        prefs.set('modify-body', true);
        Message.notice('已自动开启选项 - 修改响应体，若不需要请手动关闭');
      }
    }

    const res = await Api.saveRule(rule);
    emitter.emit(emitter.EVENT_RULE_UPDATE, res);
    this.props.onClose();
  }

  render() {
    const isHeaderSend = this.state.rule.ruleType === 'modifySendHeader';
    const isHeaderReceive = this.state.rule.ruleType === 'modifyReceiveHeader';
    const isHeader = isHeaderSend || isHeaderReceive;
    return (
      <Drawer
        className="edit-drawer"
        placement="left"
        visible={this.props.visible}
        onClose={this.props.onClose}
        title={this.isEdit ? t('edit') : t('add')}
      >
        <Form {...formItemLayout} value={this.state.rule} onChange={this.handleChange}>
          <Form.Item label={t('name')}>
            <Input name="name" />
          </Form.Item>
          <Form.Item label={t('ruleType')}>
            <Select name="ruleType" disabled={this.isEdit}>
              <Select.Option value="cancel">{t('rule_cancel')}</Select.Option>
              <Select.Option value="redirect">{t('rule_redirect')}</Select.Option>
              <Select.Option value="modifySendHeader">{t('rule_modifySendHeader')}</Select.Option>
              <Select.Option value="modifyReceiveHeader">{t('rule_modifyReceiveHeader')}</Select.Option>
              <Select.Option value="modifyReceiveBody" disabled={!IS_SUPPORT_STREAM_FILTER}>
                {t('rule_modifyReceiveBody')}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('matchType')}>
            <Select name="matchType">
              <Select.Option value="all">{t('match_all')}</Select.Option>
              <Select.Option value="regexp">{t('match_regexp')}</Select.Option>
              <Select.Option value="prefix">{t('match_prefix')}</Select.Option>
              <Select.Option value="domain">{t('match_domain')}</Select.Option>
              <Select.Option value="url">{t('match_url')}</Select.Option>
            </Select>
          </Form.Item>
          {this.state.rule.matchType !== 'all' && (
            <Form.Item label={t('matchRule')}>
              <Input name="pattern" />
            </Form.Item>
          )}
          <Form.Item label={t('excludeRule')}>
            <Input name="exclude" />
          </Form.Item>
          {/* Response body encoding */}
          {this.state.rule.ruleType === 'modifyReceiveBody' && (
            <Form.Item label={t('encoding')}>
              <Select.AutoComplete name="encoding" filterLocal dataSource={ENCODING_LIST} />
            </Form.Item>
          )}
          {/* isFunction or not */}
          <Form.Item label={t('exec_type')}>
            <Radio.Group name="isFunction" disabled={this.state.rule.ruleType === 'modifyReceiveBody'}>
              <Radio value={false} label={t('exec_normal')} />
              <Radio value={true} label={t('exec_function')} />
            </Radio.Group>
          </Form.Item>
          {/* Redirect */}
          {this.state.rule.ruleType === 'redirect' && !this.state.rule.isFunction && (
            <Form.Item label={t('redirectTo')}>
              <Input name="to" />
            </Form.Item>
          )}
          {/* Header modify */}
          {isHeader && !this.state.rule.isFunction && (
            <Form.Item label={t('headerName')}>
              <Select.AutoComplete
                name="headerName"
                filterLocal
                dataSource={isHeaderSend ? COMMON_HEADERS.request : COMMON_HEADERS.response}
              />
            </Form.Item>
          )}
          {isHeader && !this.state.rule.isFunction && (
            <Form.Item label={t('headerValue')}>
              <Input name="headerValue" />
            </Form.Item>
          )}
          {/* Custom function */}
          {this.state.rule.isFunction && (
            <Form.Item label={t('code')}>
              <Editor
                className="code-editor next-input language-javascript"
                padding="8px"
                value={this.state.rule.code}
                onValueChange={value => this.handleChange(null, { name: 'code', value })}
                // @ts-ignore
                highlight={code => highlight(code, languages.js)}
              />
            </Form.Item>
          )}
          <Form.Item label={t('test_url')}>
            <Input value={this.state.testUrl} onChange={this.handleTestChange} />
          </Form.Item>
          <Form.Item label=" ">
            <pre>{this.state.testResult}</pre>
          </Form.Item>
          <Form.Item label=" ">
            <Form.Submit onClick={this.handleSubmit}>{t('save')}</Form.Submit>
          </Form.Item>
        </Form>
      </Drawer>
    );
  }
}
