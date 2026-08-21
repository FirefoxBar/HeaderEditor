import {
  Button,
  Form,
  Space,
  useFormApi,
  useFormState,
} from '@douyinfe/semi-ui';
import { selectGroup } from '@/pages/options/utils';
import { t } from '@/share/core/browser';
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
