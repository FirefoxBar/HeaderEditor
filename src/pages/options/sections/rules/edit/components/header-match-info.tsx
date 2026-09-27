import { IconDelete, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import {
  ArrayField,
  Button,
  Form,
  Space,
  TagGroup,
  withField,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css, cx } from '@emotion/css';
import React from 'react';
import { AutoCompleteField } from '@/share/components/auto-complete';
import {
  commonHeaders,
  type HeaderFieldProps,
} from '@/share/components/header-field';
import Modal from '@/share/components/modal';
import { t } from '@/share/core/browser';

type HeaderMatchInfoProps = HeaderFieldProps;

interface ValueEditorProps {
  title: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}
const ValueEditor = ({ title, value, onChange }: ValueEditorProps) => (
  <div
    className={cx(
      'value-editor',
      css`
        display: flex;
        align-items: center;
        padding-left: 8px;
        border: 1px solid var(--semi-color-border);
        border-radius: var(--semi-border-radius-medium);
        gap: 8px;

        > .left {
          flex-grow: 1;
          flex-shrink: 1;
          overflow: hidden;

          > .semi-tag-group {
            display: flex;
          }
        }
      `,
    )}
  >
    <div className="left">
      {value?.length ? (
        <TagGroup
          maxTagCount={1}
          tagList={value.map(x => ({ children: x }))}
          showPopover
        />
      ) : (
        <span>{title}</span>
      )}
    </div>
    <Button
      icon={<IconEdit />}
      type="tertiary"
      theme="borderless"
      onClick={() => {
        let formApi: FormApi;
        Modal.info({
          title,
          icon: null,
          maskClosable: false,
          content: (
            <Form initValues={{ value }} getFormApi={api => (formApi = api)}>
              <ArrayField field="value">
                {({ add, arrayFields }) => (
                  <div
                    className={css`
                      display: flex;
                      flex-direction: column;
                      align-items: stretch;

                      .name-input {
                        flex-grow: 1;
                        flex-shrink: 1;
                      }
                    `}
                  >
                    {arrayFields.map(({ key, field: subField, remove }) => (
                      <Space key={key}>
                        <Form.Input
                          noLabel
                          field={subField}
                          fieldClassName="name-input"
                          allowEmptyString
                        />
                        <Button
                          onClick={remove}
                          type="tertiary"
                          icon={<IconDelete />}
                        />
                      </Space>
                    ))}
                    <Button
                      onClick={add}
                      icon={<IconPlus />}
                      style={{ display: 'block' }}
                    >
                      {t('add')}
                    </Button>
                  </div>
                )}
              </ArrayField>
            </Form>
          ),
          onOk: async () => {
            const values = await formApi?.getValues();
            onChange?.((values?.value || []).filter(Boolean));
          },
        });
      }}
    ></Button>
  </div>
);
const ValueEditorField = withField(ValueEditor);

const HeaderMatchInfo = ({
  field,
  type,
  initValue,
  size,
  className,
}: HeaderMatchInfoProps) => (
  <ArrayField field={field} initValue={initValue}>
    {({ add, arrayFields }) => (
      <div
        className={cx(
          'header-match-info',
          css`
            display: flex;
            flex-direction: column;
            gap: 8px;

            .semi-space > .semi-form-field {
              padding-top: 0;
              padding-bottom: 0;
            }

            .name-input {
              width: 180px;
              max-width: 40%;
              flex-shrink: 1;
              flex-grow: 0;
            }

            .value-editor-field {
              flex-shrink: 1;
              flex-grow: 1;
            }
          `,
          className,
        )}
      >
        {arrayFields.map(({ key, field: subField, remove }) => (
          <Space key={key}>
            {type ? (
              <AutoCompleteField
                noLabel
                field={`${subField}.name`}
                placeholder={t('headerName')}
                list={commonHeaders[type]}
                fieldClassName="name-input"
                size={size}
                allowEmptyString
              />
            ) : (
              <Form.Input
                noLabel
                field={`${subField}.name`}
                placeholder={t('headerName')}
                fieldClassName="name-input"
                size={size}
                allowEmptyString
              />
            )}
            <ValueEditorField
              title={t('matchRule')}
              noLabel
              field={`${subField}.value`}
              fieldClassName="value-editor-field"
            />
            <ValueEditorField
              title={t('excludeRule')}
              noLabel
              field={`${subField}.excludedValues`}
              fieldClassName="value-editor-field"
            />
            <Button
              onClick={remove}
              type="tertiary"
              icon={<IconDelete />}
              size={size}
            />
          </Space>
        ))}
        <Button onClick={add} icon={<IconPlus />}>
          {t('add')}
        </Button>
      </div>
    )}
  </ArrayField>
);

export default HeaderMatchInfo;
