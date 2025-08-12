import { Form, useFormApi } from '@douyinfe/semi-ui';
import * as React from 'react';
import { RULE_TYPE } from '@/share/core/constant';
import { IS_SUPPORT_STREAM_FILTER, t } from '@/share/core/utils';

interface BasicProps {
  isEdit: boolean;
}

const Basic = ({ isEdit }: BasicProps) => {
  const formApi = useFormApi();

  return (
    <>
      <Form.Input field="name" label={t('name')} />
      <Form.RadioGroup
        label={t('ruleType')}
        field="ruleType"
        disabled={isEdit}
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
        onChange={(evt) => {
          const { value } = evt.target;
          if (value === RULE_TYPE.MODIFY_RECV_BODY) {
            formApi.setValue('isFunction', true);
          }
          if ([RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.MODIFY_RECV_HEADER].includes(value)) {
            const editHeader = formApi.getValue('editHeader');
            console.log('editHeader', editHeader);
            if (!editHeader) {
              formApi.setValue('editHeader', [{ name: '', value: '' }]);
            }
          }
        }}
      />
    </>
  );
};

export default Basic;
