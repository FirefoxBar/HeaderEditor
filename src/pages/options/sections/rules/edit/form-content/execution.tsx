import {
  Form,
  useFormState,
} from '@douyinfe/semi-ui';
import * as React from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import { RULE_TYPE } from '@/share/core/constant';
import { t } from '@/share/core/utils';
import HeaderField from '@/share/components/header-field';
import { CodeEditorField } from '../code-editor';
import ENCODING_LIST from '../encoding';
import { RuleInput } from '../utils';

const Execution = () => {
  const { values } = useFormState();

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
      {ruleType === 'redirect' && !isFunction && <Form.Input label={t('redirectTo')} field="to" />}
      {/* Header modify */}
      {isHeader && !isFunction && (
        <Form.Slot label={t(isHeaderSend ? 'request_headers' : 'response_headers')}>
          <HeaderField field="editHeader" type={isHeaderSend ? 'request' : 'response'} />
        </Form.Slot>
      )}
      {/* Custom function */}
      {isFunction && <CodeEditorField field="code" label={t('code')} height="200px" />}
    </>
  );
};

export default Execution;
