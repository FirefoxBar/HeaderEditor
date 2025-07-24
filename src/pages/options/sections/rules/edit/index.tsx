import { IconExternalOpen, IconSave } from '@douyinfe/semi-icons';
import { Banner, Button, Form, Input, SideSheet, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import * as React from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import { IS_MATCH, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import { initRule, isMatchUrl } from '@/share/core/rule-utils';
import type { InitdRule, Rule } from '@/share/core/types';
import { IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { AutoCompleteField } from './auto-complete';
import { CodeEditorField } from './code-editor';
import ENCODING_LIST from './encoding';
import COMMON_HEADERS from './headers';

const { Text } = Typography;

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

interface RuleInput extends Rule {
  headerName?: string;
  headerValue?: string;
}

function getInput(rule: Rule) {
  const res: RuleInput = { ...rule };
  if (
    typeof res.action === 'object' &&
    (res.ruleType === 'modifySendHeader' || res.ruleType === 'modifyReceiveHeader')
  ) {
    res.headerName = res.action.name;
    res.headerValue = res.action.value;
  }
  return res;
}

function getRuleFromInput(input: RuleInput): Rule {
  const res = { ...input };
  if (res.ruleType === 'modifySendHeader' || res.ruleType === 'modifyReceiveHeader') {
    res.action = {
      name: res.headerName || '',
      value: res.headerValue || '',
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
    this.setState(
      (prevState) => {
        const rule = { ...prevState.rule };
        Object.keys(item).forEach((k) => {
          rule[k] = item[k];
        });
        if (item.name === 'ruleType' && item.value === RULE_TYPE.MODIFY_RECV_BODY) {
          rule.isFunction = true;
        }

        return { rule };
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
          this.initedRule = initRule(this.state.rule, true);
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
      this.setState(
        {
          rule: newRule,
        },
        () => {
          this.formApi?.reset();
          this.formApi?.setValues(newRule);
        },
      );
    }
  }

  async handleSubmit() {
    const rule = getRuleFromInput(this.state.rule);
    // 常规检查
    if (rule.name === '') {
      Toast.error(t('name_empty'));
      return;
    }
    if (rule.matchType !== 'all' && rule.pattern === '') {
      Toast.error(t('match_rule_empty'));
      return;
    }
    if (rule.ruleType !== RULE_TYPE.MODIFY_RECV_BODY && !rule.encoding) {
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
        Toast.info(t('auto-enable-modify-body'));
      }
    }

    await Api.saveRule(rule);
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

            .semi-form {
              .semi-form-field-main {
                > .semi-autocomplete,
                > .semi-select {
                  width: 100%;
                }
              }
            }
          }
        `}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button theme="solid" onClick={this.handleSubmit} icon={<IconSave />}>
              {t('save')}
            </Button>
          </div>
        }
      >
        {MANIFEST_VER === 'v3' && (
          <Banner
            type="info"
            description={
              <Space>
                {t('lite_edit_tip')}{' '}
                <Text link={{ href: t('url_help'), target: '_blank' }} style={{ lineHeight: '14px' }}>
                  <IconExternalOpen />
                </Text>
              </Space>
            }
          />
        )}
        <Form
          labelCol={{ fixedSpan: 6 }}
          getFormApi={(api) => (this.formApi = api)}
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
              { label: t('rule_cancel'), value: RULE_TYPE.CANCEL },
              { label: t('rule_redirect'), value: RULE_TYPE.REDIRECT },
              { label: t('rule_modifySendHeader'), value: RULE_TYPE.MODIFY_SEND_HEADER },
              { label: t('rule_modifyReceiveHeader'), value: RULE_TYPE.MODIFY_RECV_HEADER },
              { label: t('rule_modifyReceiveBody'), value: RULE_TYPE.MODIFY_RECV_BODY, disabled: !IS_SUPPORT_STREAM_FILTER },
            ]}
          />
          <Form.Select
            label={t('matchType')}
            field="matchType"
            optionList={[
              { label: t('match_all'), value: RULE_MATCH_TYPE.ALL },
              { label: t('match_regexp'), value: RULE_MATCH_TYPE.REGEXP },
              { label: t('match_prefix'), value: RULE_MATCH_TYPE.PREFIX },
              { label: t('match_domain'), value: RULE_MATCH_TYPE.DOMAIN },
              { label: t('match_url'), value: RULE_MATCH_TYPE.URL },
            ]}
          />
          {this.state.rule.matchType !== RULE_MATCH_TYPE.ALL && <Form.Input label={t('matchRule')} field="pattern" />}
          <Form.Input
            label={t('excludeRule')}
            field="exclude"
            helpText={MANIFEST_VER === 'v3' ? <Text type="tertiary">{t('lite_not_supported')}</Text> : undefined}
          />
          {/* Response body encoding */}
          {this.state.rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY && (
            <Form.Select
              filter
              field="encoding"
              label={t('encoding')}
              optionList={ENCODING_LIST.map((x) => ({ label: x, value: x }))}
            />
          )}
          {/* isFunction or not */}
          <BoolRadioGroupField
            label={t('exec_type')}
            field="isFunction"
            options={[
              { label: t('exec_normal'), value: false },
              { label: t('exec_function'), value: true, disabled: !ENABLE_EVAL },
            ]}
          />
          {/* Redirect */}
          {this.state.rule.ruleType === 'redirect' && !this.state.rule.isFunction && (
            <Form.Input label={t('redirectTo')} field="to" />
          )}
          {/* Header modify */}
          {isHeader && !this.state.rule.isFunction && (
            <AutoCompleteField
              field="headerName"
              label={t('headerName')}
              list={isHeaderSend ? COMMON_HEADERS.request : COMMON_HEADERS.response}
            />
          )}
          {isHeader && !this.state.rule.isFunction && <Form.Input label={t('headerValue')} field="headerValue" />}
          {/* Custom function */}
          {this.state.rule.isFunction && <CodeEditorField field="code" label={t('code')} height="200px" />}
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
