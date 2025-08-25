import {
  Button,
  Form,
  Space,
  useFormApi,
  useFormState,
} from '@douyinfe/semi-ui';
import * as React from 'react';
import { selectGroup } from '@/pages/options/utils';
import { RULE_MATCH_TYPE } from '@/share/core/constant';
import { isValidArray, t } from '@/share/core/utils';
import Domains from '../domains';
import { METHOD_LIST, RESOURCE_TYPE_LIST } from '../options';
import type { RuleInput } from '../utils';

const Group = () => {
  const formApi = useFormApi();
  const { values } = useFormState();

  const { group } = values as RuleInput;

  return (
    <Form.Slot label={t('group')}>
      <Space style={{ lineHeight: '32px' }}>
        <span>{group}</span>
        <Button
          onClick={() =>
            selectGroup(group).then(newGroup =>
              formApi.setValue('group', newGroup),
            )
          }
          size="small"
          type="primary"
        >
          {t('choose')}
        </Button>
      </Space>
    </Form.Slot>
  );
};

export default Group;
