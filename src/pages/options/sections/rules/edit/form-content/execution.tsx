import { Form, useFormState } from '@douyinfe/semi-ui';
import * as React from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import HeaderField from '@/share/components/header-field';
import { RULE_TYPE } from '@/share/core/constant';
import { t } from '@/share/core/utils';
import usePref from '@/share/hooks/use-pref';
import { CodeEditorField } from '../code-editor';
import ENCODING_LIST from '../encoding';
import type { RuleInput } from '../utils';

const Execution = () => {
  const { values } = useFormState();

  const [showCommonHeader] = usePref('show-common-header');

  const { ruleType, isFunction } = values as RuleInput;
  const isHeaderSend = values.ruleType === 'modifySendHeader';
  const isHeaderReceive = values.ruleType === 'modifyReceiveHeader';
  const isHeader = isHeaderSend || isHeaderReceive;

  return (
    <>
      {/* Response body encoding */}
      {ruleType === RULE_TYPE.MODIFY_RECV_BODY && (
        <Form.Select
          filter
          field="encoding"
          label={t('encoding')}
          optionList={ENCODING_LIST.map(x => ({ label: x, value: x }))}
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
      {ruleType === 'redirect' && !isFunction && (
        <Form.Input label={t('redirectTo')} field="to" />
      )}
      {/* Header modify */}
      {isHeader && !isFunction && (
        <Form.Slot
          label={t(isHeaderSend ? 'request_headers' : 'response_headers')}
        >
          <HeaderField
            field="editHeader"
            // eslint-disable-next-line no-nested-ternary
            type={
              showCommonHeader
                ? isHeaderSend
                  ? 'request'
                  : 'response'
                : undefined
            }
          />
        </Form.Slot>
      )}
      {/* Custom function */}
      {(isFunction || ruleType === RULE_TYPE.MODIFY_RECV_BODY) && (
        <CodeEditorField
          field={isFunction ? 'code' : 'bodyValue'}
          label={t('code')}
          height="200px"
        />
      )}
    </>
  );
};

export default Execution;
