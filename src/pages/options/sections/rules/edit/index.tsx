import { IconSave } from '@douyinfe/semi-icons';
import { Button, Form, SideSheet, Toast, Typography } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import * as React from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import type { Rule } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import FormContent from './form-content';
import { EMPTY_RULE, getInput, getRuleFromInput } from './utils';

const { Text } = Typography;

interface EditProps {
  visible: boolean;
  rule?: Rule;
  onClose: () => void;
}

const defaultInput = getInput(EMPTY_RULE);

export default class Edit extends React.Component<EditProps> {
  private formApi: FormApi | null = null;
  constructor(props: any) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  get isEdit() {
    return !!this.props.rule;
  }

  componentDidUpdate(prevProps: EditProps) {
    if (this.props.rule !== prevProps.rule) {
      const newRule = this.props.rule ? this.props.rule : EMPTY_RULE;
      const input = getInput(newRule);
      this.formApi?.reset();
      this.formApi?.setValues(input);
    }
  }

  async handleSubmit() {
    if (!this.formApi) {
      return;
    }
    const rule = getRuleFromInput(this.formApi.getValues());
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
          labelPosition="left"
          labelAlign="right"
          labelWidth={140}
          initValues={defaultInput}
        >
          <FormContent isEdit={this.isEdit} />
        </Form>
      </SideSheet>
    );
  }
}
