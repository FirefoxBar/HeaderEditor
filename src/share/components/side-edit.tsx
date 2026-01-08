import { IconSave } from '@douyinfe/semi-icons';
import { Button, Form, SideSheet, Space, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { cloneDeep } from 'lodash-es';
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { t } from '@/share/core/utils';

interface SideEditProps<T, ET> {
  value?: T;
  defaultValue: T;
  getInput: (value: T) => ET;
  getValue: (input: ET) => T;

  onClose: () => void;
  validate: (value: T) => Promise<void>;
  onSave: (value: T) => Promise<void>;

  footer?: ReactNode;
  visible: boolean;
  isEdit: boolean;
}

const SideEdit = <T extends {}, ET extends {} = T>({
  value,
  defaultValue,
  getInput,
  getValue,
  onClose,
  validate,
  onSave,
  footer,
  visible,
  isEdit,
  children,
}: PropsWithChildren<SideEditProps<T, ET>>) => {
  const formApi = useRef<FormApi<ET>>();

  const initValue = useMemo(() => {
    const v = value || cloneDeep(defaultValue);
    return getInput ? getInput(v) : (v as unknown as ET);
  }, [value]);

  useEffect(() => {
    formApi.current?.reset();
    formApi.current?.setValues(initValue);
  }, [initValue]);

  const { run: doSubmit, loading } = useRequest(
    async () => {
      if (!formApi.current) {
        throw new Error('No form api');
      }
      const v = formApi.current.getValues();
      const val = getValue ? getValue(v) : (v as unknown as T);

      if (validate) {
        await validate(val);
      }

      return onSave(val);
    },
    {
      manual: true,
      onSuccess: () => onClose?.(),
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
              > .semi-input-number,
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
            justifyContent: 'flex-end',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <Space>
            {footer}
            <Button
              theme="solid"
              onClick={doSubmit}
              icon={<IconSave />}
              loading={loading}
            >
              {t('save')}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        labelCol={{ fixedSpan: 4 }}
        getFormApi={api => (formApi.current = api)}
        labelPosition="left"
        labelAlign="right"
        labelWidth={140}
        initValues={initValue}
      >
        {children}
      </Form>
    </SideSheet>
  );
};

export default SideEdit;
