import { IconSave } from '@douyinfe/semi-icons';
import { Button, Form, SideSheet, Toast, Typography } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { RE2JS } from 're2js';
import React, { useEffect, useMemo, useRef } from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import { prefs } from '@/share/core/prefs';
import { detectRunner } from '@/share/core/rule-utils';
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

const Edit = ({ visible, rule: ruleProp, onClose }: EditProps) => {
  const formApi = useRef<FormApi>();

  const isEdit = Boolean(ruleProp);

  const initInput = useMemo(() => {
    const rule = ruleProp || EMPTY_RULE;
    return getInput(rule);
  }, [ruleProp]);

  useEffect(() => {
    formApi.current?.reset();
    formApi.current?.setValues(initInput);
  }, [initInput]);

  const { run: doSubmit, loading } = useRequest(
    async () => {
      if (!formApi.current) {
        throw new Error('No form api');
      }
      const rule = getRuleFromInput(formApi.current.getValues());
      // 常规检查
      if (!rule.name) {
        throw new Error(t('name_empty'));
      }
      if (!rule.condition) {
        throw new Error(t('match_rule_empty'));
      }
      if (rule.condition.regex) {
        RE2JS.compile(rule.condition.regex);
      }
      if (
        [
          'all',
          'url',
          'urlPrefix',
          'method',
          'domain',
          'regex',
          'resourceTypes',
        ].every(x => typeof rule.condition![x] === 'undefined')
      ) {
        throw new Error(t('match_rule_empty'));
      }
      if (rule.ruleType !== RULE_TYPE.MODIFY_RECV_BODY && !rule.encoding) {
        rule.encoding = 'UTF-8';
      }

      if (rule.isFunction) {
        if (rule.code === '') {
          throw new Error(t('code_empty'));
        }
      } else {
        if (rule.ruleType === 'redirect' && (!rule.to || rule.to === '')) {
          throw new Error(t('redirect_empty'));
        }
        if (
          rule.ruleType === 'modifySendHeader' ||
          rule.ruleType === 'modifyReceiveHeader'
        ) {
          const validateValue = Object.entries(rule.headers || {}).filter(
            ([k]) => Boolean(k),
          );
          if (validateValue.length === 0) {
            throw new Error(t('header_empty'));
          }
        }
      }

      // 检查是否有开启
      if (rule.ruleType === RULE_TYPE.MODIFY_RECV_BODY) {
        if (!prefs.get('modify-body')) {
          prefs.set('modify-body', true);
          Toast.info(t('auto_enable_modify_body'));
        }
      }

      return Api.saveRule(rule);
    },
    {
      manual: true,
      onSuccess: () => onClose(),
      onError: e => Toast.error(e.message),
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {MANIFEST_VER === 'v3' && (
            <Text
              type="tertiary"
              link={{ href: t('url_help'), target: '_blank' }}
            >
              {t('lite_edit_tip')}
            </Text>
          )}
          <Button
            theme="solid"
            onClick={doSubmit}
            icon={<IconSave />}
            loading={loading}
          >
            {t('save')}
          </Button>
        </div>
      }
    >
      <Form
        labelCol={{ fixedSpan: 4 }}
        getFormApi={api => (formApi.current = api)}
        labelPosition="left"
        labelAlign="right"
        labelWidth={140}
        initValues={initInput}
      >
        <FormContent isEdit={isEdit} />
      </Form>
    </SideSheet>
  );
};

export default Edit;
