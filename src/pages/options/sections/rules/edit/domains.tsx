import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { ArrayField, Space, Form, Button } from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import React from 'react';
import { t } from '@/share/core/utils';

interface DomainsProps {
  field: string;
  initValue?: any;
}

const Domains = ({ field, initValue }: DomainsProps) => (
  <ArrayField field={field} initValue={initValue}>
    {({ add, arrayFields }) => (
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 8px;

          .semi-space > .semi-form-field {
            padding-top: 0;
            padding-bottom: 0;
            flex-grow: 1;
            flex-shrink: 1;
          }
        `}
      >
        {arrayFields.map(({ key, field: subField, remove }) => (
          <Space key={key}>
            <Form.Input noLabel placeholder="sub.example.com" field={subField} allowEmptyString />
            <Button onClick={remove} icon={<IconDelete />} />
          </Space>
        ))}
        <Button onClick={add} icon={<IconPlus />}>
          {t('add')}
        </Button>
      </div>
    )}
  </ArrayField>
);

export default Domains;
