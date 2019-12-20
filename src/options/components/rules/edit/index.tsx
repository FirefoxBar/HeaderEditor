import { Drawer, Form, Input, Radio, Select } from '@alifd/next';
import { highlight, languages } from 'prismjs';
import * as React from 'react';
import Editor from 'react-simple-code-editor';
import { IS_SUPPORT_STREAM_FILTER, t } from 'share/core/utils';
import { Rule } from 'share/core/var';
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
  matchType: 'all',
  pattern: '',
  exclude: '',
  isFunction: false,
  code: '',
};

export default class Edit extends React.Component<EditProps, EditState> {
  constructor(props: any) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      rule: { ...EMPTY_RULE },
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
    this.setState({
      rule,
    });
  }

  componentDidUpdate(prevProps: EditProps) {
    if (this.props.rule !== prevProps.rule) {
      this.setState({
        rule: { ...(this.props.rule ? this.props.rule : EMPTY_RULE) },
      });
    }
  }

  render() {
    const isHeaderSend = this.state.rule.ruleType === 'modifySendHeader';
    const isHeaderReceive = this.state.rule.ruleType === 'modifyReceiveHeader';
    const isHeader = isHeaderSend || isHeaderReceive;
    return (
      <Drawer
        className="edit-drawer"
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
              <Input name="matchRule" />
            </Form.Item>
          )}
          <Form.Item label={t('excludeRule')}>
            <Input name="exclude" />
          </Form.Item>
          {/* Response body encoding */}
          {this.state.rule.ruleType === 'modifyReceiveBody' && (
            <Form.Item label={t('encoding')}>
              <Select name="encoding" showSearch filterLocal dataSource={ENCODING_LIST} />
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
              <Input name="redirectTo" />
            </Form.Item>
          )}
          {/* Header mondify */}
          {isHeader && !this.state.rule.isFunction && (
            <Form.Item label={t('headerName')}>
              <Select
                name="headerName"
                showSearch
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
          <Form.Item label=" ">
            <Form.Submit>Confirm</Form.Submit>
          </Form.Item>
        </Form>
      </Drawer>
    );
  }
}
