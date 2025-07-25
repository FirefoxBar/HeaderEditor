/* eslint-disable max-lines */
import { IconSave } from '@douyinfe/semi-icons';
import { Button, Collapse, Form, Input, SideSheet, Toast, Typography } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import * as React from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import { IS_MATCH, RULE_MATCH_TYPE, RULE_TYPE } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import { initRule, isMatchUrl } from '@/share/core/rule-utils';
import type { BasicRule, InitdRule, Rule } from '@/share/core/types';
import { IS_SUPPORT_STREAM_FILTER, isValidArray, t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { CodeEditorField } from './code-editor';
import ENCODING_LIST from './encoding';
import HeaderField from './headers';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from './options';
import Domains from './domains';

const { Text } = Typography;

interface RuleInput extends Rule {
  editHeader?: Array<{ name: string; value: string }>;
  editMatchType?: RULE_MATCH_TYPE[];
  editExcludeType?: Array<'method' | 'regex' | 'domain' | 'resourceType'>;
}

interface EditProps {
  visible: boolean;
  rule?: Rule;
  onClose: () => void;
}

interface EditState {
  rule: BasicRule;
  value: RuleInput;
  testUrl: string;
  testResult: string;
}

const EMPTY_RULE: Rule = {
  id: -1,
  enable: true,
  group: t('ungrouped'),
  name: '',
  ruleType: RULE_TYPE.CANCEL,
  isFunction: false,
  code: '',
  action: 'cancel',
};

const EMPTY_ARR = [];

function getInput(rule: Rule) {
  const res: RuleInput = { ...rule };
  if (res.headers) {
    res.editHeader = Object.entries(res.headers).map(([name, value]) => ({ name, value }));
  }
  if (res.condition) {
    res.editMatchType = [];
    res.editExcludeType = [];
    const {
      all,
      url,
      urlPrefix,
      method,
      domain,
      regex,
      resourceTypes,
      excludeDomain,
      excludeRegex,
      excludeResourceTypes,
    } = res.condition;
    if (all) {
      res.editMatchType.push(RULE_MATCH_TYPE.ALL);
    }
    if (url) {
      res.editMatchType.push(RULE_MATCH_TYPE.URL);
    }
    if (urlPrefix) {
      res.editMatchType.push(RULE_MATCH_TYPE.PREFIX);
    }
    if (method) {
      res.editMatchType.push(RULE_MATCH_TYPE.METHOD);
    }
    if (isValidArray(domain)) {
      res.editMatchType.push(RULE_MATCH_TYPE.DOMAIN);
    }
    if (regex) {
      res.editMatchType.push(RULE_MATCH_TYPE.REGEXP);
    }
    if (resourceTypes) {
      res.editMatchType.push(RULE_MATCH_TYPE.RESOURCE_TYPE);
    }
    if (isValidArray(excludeDomain)) {
      res.editExcludeType.push('domain');
    }
    if (excludeRegex) {
      res.editExcludeType.push('regex');
    }
    if (excludeResourceTypes) {
      res.editExcludeType.push('resourceType');
    }
  }
  return res;
}

function getRuleFromInput(input: RuleInput): Rule {
  const res = { ...input };
  if (res.ruleType === 'modifySendHeader' || res.ruleType === 'modifyReceiveHeader') {
    if (Array.isArray(res.editHeader)) {
      res.headers = Object.fromEntries(res.editHeader.filter((x) => Boolean(x.name)).map((x) => [x.name, x.value]));
    }
    delete res.editHeader;
  }
  delete res.editMatchType;
  delete res.editExcludeType;
  console.log('getRuleFromInput', res, input);
  return res;
}

export default class Edit extends React.Component<EditProps, EditState> {
  private initdRule?: InitdRule;
  private formApi: FormApi | null = null;
  constructor(props: any) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTestChange = this.handleTestChange.bind(this);

    this.state = {
      rule: EMPTY_RULE,
      value: getInput(EMPTY_RULE),
      testUrl: '',
      testResult: '',
    };
  }

  get isEdit() {
    return !!this.props.rule;
  }

  handleChange(_: any, changedValue: any) {
    let updateEditHeader = false;
    let updateConditionDomain = false;
    let updateConditionExcludeDomain = false;
    if (!this.formApi) {
      return;
    }
    const input = this.formApi.getValues();
    if ('ruleType' in changedValue) {
      if (changedValue.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
        input.isFunction = true;
      }
      if ([RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER].includes(changedValue.ruleType)) {
        if (!input.editHeader) {
          input.editHeader = [{ name: '', value: '' }];
          updateEditHeader = true;
        }
      }
    }
    if ('editMatchType' in changedValue) {
      if (changedValue.editMatchType.includes(RULE_MATCH_TYPE.DOMAIN) && !isValidArray(input.condition?.domain)) {
        input.condition = input.condition || {};
        input.condition.domain = [''];
        updateConditionDomain = true;
      }
    }
    if ('editExcludeType' in changedValue) {
      if (changedValue.editExcludeType.includes('domain') && !isValidArray(input.condition?.excludeDomain)) {
        input.condition = input.condition || {};
        input.condition.excludeDomain = [''];
        updateConditionExcludeDomain = true;
      }
    }

    this.setState({ rule: getRuleFromInput(input), value: input }, () => {
      this.getTestResult(true);
      if (updateEditHeader) {
        this.formApi?.setValue('editHeader', this.state.value.editHeader);
      }
      if (updateConditionDomain) {
        this.formApi?.setValue('condition.domain', this.state.rule.condition!.domain);
      }
      if (updateConditionExcludeDomain) {
        this.formApi?.setValue('condition.excludeDomain', this.state.rule.condition!.excludeDomain);
      }
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
      if (reInit || !this.initdRule) {
        try {
          this.initdRule = initRule(this.state.rule, true);
        } catch (e) {
          // 出错
          this.setState({
            testResult: e.message,
          });
        }
      }
      // 运行
      if (this.initdRule) {
        const match = isMatchUrl(this.initdRule, this.state.testUrl);
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
        if (this.initdRule.isFunction) {
          this.setState({
            testResult: t('test_custom_code'),
          });
          return;
        }
        // 只有重定向支持测试详细功能，其他只返回匹配
        if (this.initdRule.ruleType === 'redirect' && this.initdRule.to) {
          let redirect = '';
          if (this.initdRule?._reg) {
            this.initdRule._reg.lastIndex = 0;
            redirect = this.state.testUrl.replace(this.initdRule._reg, this.initdRule.to);
          } else {
            redirect = this.initdRule.to;
          }
          if (/^(http|https|ftp|file)%3A/.test(redirect)) {
            redirect = decodeURIComponent(redirect);
          }
          this.setState({
            testResult: redirect,
          });
        } else {
          this.setState({
            testResult: t('test_match'),
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
      const newRule = this.props.rule ? this.props.rule : EMPTY_RULE;
      const input = getInput(newRule);
      this.setState(
        {
          rule: newRule,
        },
        () => {
          this.formApi?.reset();
          this.formApi?.setValues(input);
        },
      );
    }
  }

  async handleSubmit() {
    const { rule } = this.state;
    // 常规检查
    if (rule.name === '') {
      Toast.error(t('name_empty'));
      return;
    }
    // TODO: 完善检查
    // if (rule.matchType !== 'all') {
    //   Toast.error(t('match_rule_empty'));
    //   return;
    // }
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
    const { value } = this.state;
    const { editMatchType = [], editExcludeType = [] } = value;
    const isHeaderSend = value.ruleType === 'modifySendHeader';
    const isHeaderReceive = value.ruleType === 'modifyReceiveHeader';
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

            .semi-collapse {
              .semi-collapse-header {
                margin-left: 0;
                margin-right: 0;
              }
              .semi-collapse-content {
                padding-left: 0;
                padding-right: 0;
              }
            }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
            <Text type="tertiary" link={{ href: t('url_help'), target: '_blank' }}>
              {t('lite_edit_tip')}
            </Text>
            <Button theme="solid" onClick={this.handleSubmit} icon={<IconSave />}>
              {t('save')}
            </Button>
          </div>
        }
      >
        <Form
          labelCol={{ fixedSpan: 6 }}
          getFormApi={(api) => (this.formApi = api)}
          initValues={value}
          onValueChange={this.handleChange}
          labelPosition="left"
          labelAlign="right"
          labelWidth={140}
        >
          <Collapse defaultActiveKey={['basic', 'match', 'exclude', 'execution', 'test']}>
            <Collapse.Panel header={t('basic_information')} itemKey="basic">
              <Form.Input field="name" label={t('name')} />
              <Form.RadioGroup
                label={t('ruleType')}
                field="ruleType"
                disabled={this.isEdit}
                options={[
                  { label: t('rule_cancel'), value: RULE_TYPE.CANCEL },
                  { label: t('rule_redirect'), value: RULE_TYPE.REDIRECT },
                  { label: t('rule_modifySendHeader'), value: RULE_TYPE.MODIFY_SEND_HEADER },
                  { label: t('rule_modifyReceiveHeader'), value: RULE_TYPE.MODIFY_RECV_HEADER },
                  {
                    label: t('rule_modifyReceiveBody'),
                    value: RULE_TYPE.MODIFY_RECV_BODY,
                    disabled: !IS_SUPPORT_STREAM_FILTER,
                  },
                ]}
              />
            </Collapse.Panel>
            <Collapse.Panel header={t('matchType')} itemKey="match">
              <Form.CheckboxGroup
                label={t('matchType')}
                field="editMatchType"
                options={[
                  {
                    label: t('match_all'),
                    value: RULE_MATCH_TYPE.ALL,
                    disabled: [
                      RULE_MATCH_TYPE.REGEXP,
                      RULE_MATCH_TYPE.DOMAIN,
                      RULE_MATCH_TYPE.PREFIX,
                      RULE_MATCH_TYPE.URL,
                    ].some((x) => editMatchType.includes(x)),
                  },
                  {
                    label: t('match_regexp'),
                    value: RULE_MATCH_TYPE.REGEXP,
                    disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.PREFIX, RULE_MATCH_TYPE.URL].some((x) =>
                      editMatchType.includes(x)),
                  },
                  {
                    label: t('match_domain'),
                    value: RULE_MATCH_TYPE.DOMAIN,
                    disabled: editMatchType.includes(RULE_MATCH_TYPE.ALL),
                  },
                  {
                    label: t('match_prefix'),
                    value: RULE_MATCH_TYPE.PREFIX,
                    disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.REGEXP, RULE_MATCH_TYPE.URL].some((x) =>
                      editMatchType.includes(x)),
                  },
                  {
                    label: t('match_url'),
                    value: RULE_MATCH_TYPE.URL,
                    disabled: [RULE_MATCH_TYPE.ALL, RULE_MATCH_TYPE.REGEXP, RULE_MATCH_TYPE.PREFIX].some((x) =>
                      editMatchType.includes(x)),
                  },
                  {
                    label: t('match_method'),
                    value: RULE_MATCH_TYPE.METHOD,
                    disabled: editExcludeType.includes('method'),
                  },
                  {
                    label: t('match_resourceType'),
                    value: RULE_MATCH_TYPE.RESOURCE_TYPE,
                    disabled: editExcludeType.includes('resourceType'),
                  },
                ]}
              />
              {editMatchType.includes(RULE_MATCH_TYPE.REGEXP) && (
                <Form.Input label={t('match_regexp')} field="condition.regex" />
              )}
              {editMatchType.includes(RULE_MATCH_TYPE.DOMAIN) && (
                <Form.Slot label={t('match_domain')}>
                  <Domains field="condition.domain" initValue={value.condition?.domain || EMPTY_ARR} />
                </Form.Slot>
              )}
              {editMatchType.includes(RULE_MATCH_TYPE.PREFIX) && (
                <Form.Input label={t('match_prefix')} field="condition.urlPrefix" />
              )}
              {editMatchType.includes(RULE_MATCH_TYPE.URL) && (
                <Form.Input label={t('match_url')} field="condition.url" />
              )}
              {editMatchType.includes(RULE_MATCH_TYPE.METHOD) && (
                <Form.Select multiple label={t('match_method')} field="condition.method" optionList={METHOD_LIST} />
              )}
              {editMatchType.includes(RULE_MATCH_TYPE.RESOURCE_TYPE) && (
                <Form.Select
                  multiple
                  label={t('match_resourceType')}
                  field="condition.resourceTypes"
                  optionList={RESOURCE_TYPE_LIST}
                />
              )}
            </Collapse.Panel>
            <Collapse.Panel header={t('excludeRule')} itemKey="exclude">
              <Form.CheckboxGroup
                label={t('excludeRule')}
                field="editExcludeType"
                options={[
                  {
                    label: t('match_regexp'),
                    value: RULE_MATCH_TYPE.REGEXP,
                    disabled: MANIFEST_VER === 'v3',
                  },
                  {
                    label: t('match_domain'),
                    value: 'domain',
                  },
                  {
                    label: t('match_method'),
                    value: 'method',
                    disabled: editMatchType.includes(RULE_MATCH_TYPE.METHOD),
                  },
                  {
                    label: t('match_resourceType'),
                    value: 'resourceType',
                    disabled: editMatchType.includes(RULE_MATCH_TYPE.RESOURCE_TYPE),
                  },
                ]}
              />
              {editExcludeType.includes('regex') && (
                <Form.Input
                  label={t('match_regexp')}
                  field="condition.excludeRegex"
                  helpText={MANIFEST_VER === 'v3' ? <Text type="tertiary">{t('lite_not_supported')}</Text> : undefined}
                />
              )}
              {editExcludeType.includes('domain') && (
                <Form.Slot label={t('match_domain')}>
                  <Domains field="condition.excludeDomain" initValue={value.condition?.excludeDomain || EMPTY_ARR} />
                </Form.Slot>
              )}
              {editExcludeType.includes('method') && (
                <Form.Select multiple label={t('match_method')} field="condition.excludeMethod" optionList={METHOD_LIST} />
              )}
              {editExcludeType.includes('resourceType') && (
                <Form.Select
                  multiple
                  label={t('match_resourceType')}
                  field="condition.excludeResourceTypes"
                  optionList={RESOURCE_TYPE_LIST}
                />
              )}
            </Collapse.Panel>
            <Collapse.Panel header={t('execution')} itemKey="execution">
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
                <Form.Slot label={t(isHeaderSend ? 'request_headers' : 'response_headers')}>
                  <HeaderField
                    field="editHeader"
                    type={isHeaderSend ? 'request' : 'response'}
                    initValue={value.editHeader}
                  />
                </Form.Slot>
              )}
              {/* Custom function */}
              {this.state.rule.isFunction && <CodeEditorField field="code" label={t('code')} height="200px" />}
            </Collapse.Panel>
            <Collapse.Panel header={t('test_url')} itemKey="test">
              <Input value={this.state.testUrl} onChange={this.handleTestChange} />
              <pre>{this.state.testResult}</pre>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </SideSheet>
    );
  }
}
