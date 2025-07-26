import { IconSave } from '@douyinfe/semi-icons';
import { Button, Form, SideSheet, Toast, Typography } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import React, { useEffect, useRef } from 'react';
import Api from '@/share/pages/api';
import { t } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { prefs } from '@/share/core/prefs';
import { RULE_TYPE } from '@/share/core/constant';
import FormContent from './form-content';
import { EMPTY_RULE, getInput, getRuleFromInput } from './utils';

const { Text } = Typography;

interface EditProps {
  visible: boolean;
  rule?: Rule;
  onClose: () => void;
}

const defaultInput = getInput(EMPTY_RULE);

const Edit = ({ visible, rule: ruleProp, onClose }: EditProps) => {
  const formApi = useRef<FormApi>();

  const isEdit = Boolean(ruleProp);

  useEffect(() => {
    const rule = ruleProp || EMPTY_RULE;
    const input = getInput(rule);
    formApi.current?.reset();
    formApi.current?.setValues(input);
  }, [ruleProp]);

  const { run: doSubmit, loading } = useRequest(
    async () => {
      if (!formApi.current) {
        return;
      }
      const rule = getRuleFromInput(formApi.current.getValues());
      // debugger;
      // 常规检查
      if (!rule.name) {
        Toast.error(t('name_empty'));
        return;
      }
      if (!rule.condition) {
        Toast.error(t('match_rule_empty'));
        return;
      }
      if (['all', 'url', 'urlPrefix', 'method', 'domain', 'regex', 'resourceTypes'].every((x) => typeof rule.condition![x] === 'undefined')) {
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
      if (rule.ruleType === 'modifySendHeader' || rule.ruleType === 'modifyReceiveHeader') {
        const validateValue = Object.entries(rule.headers || {}).filter(([k]) => Boolean(k));
        if (validateValue.length === 0) {
          Toast.error(t('header_empty'));
          return;
        }
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
      onClose();
    },
    {
      manual: true,
    },
  );

  return (
    <SideSheet
      placement="right"
      visible={visible}
      onCancel={onClose}
      title={isEdit ? t('edit') : t('add')}
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
          <Button theme="solid" onClick={doSubmit} icon={<IconSave />} loading={loading}>
            {t('save')}
          </Button>
        </div>
      }
    >
      <Form
        labelCol={{ fixedSpan: 6 }}
        getFormApi={(api) => (formApi.current = api)}
        labelPosition="left"
        labelAlign="right"
        labelWidth={140}
        initValues={defaultInput}
      >
        <FormContent isEdit={isEdit} />
      </Form>
    </SideSheet>
  );
};

export default Edit;
