import { IconSave } from '@douyinfe/semi-icons';
import {
  Button,
  Form,
  SideSheet,
  Toast,
  useFormState,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import { Cron } from 'croner';
import { apply as applyJsonLogic } from 'json-logic-js';
import { useEffect, useMemo, useRef } from 'react';
import { BoolRadioGroupField } from '@/pages/options/components/bool-radio';
import { CodeEditorField } from '@/pages/options/components/code-editor';
import { METHOD_LIST } from '@/pages/options/constant';
import HeaderField from '@/share/components/header-field';
import type { Task } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { EMPTY_TASK, getTaskFromInput } from '../utils';

interface EditProps {
  visible: boolean;
  task?: Task;
  onClose: () => void;
}

// 执行类型配置组件
const ExecutionConfig = () => {
  const { values } = useFormState();

  return (
    <>
      {values.execute === 'interval' && (
        <Form.InputNumber field="interval" label={t('task_interval')} min={1} />
      )}
      {values.execute === 'cron' && (
        <Form.Input
          field="cron"
          label={t('task_cron_expression')}
          placeholder="*/10 * * * *"
        />
      )}
    </>
  );
};

// 任务配置组件
const TaskConfig = () => {
  const { values } = useFormState();

  return (
    <>
      {!values.isFunction ? (
        <>
          <Form.Input
            field="fetch.url"
            label={t('task_fetch_url')}
            placeholder="https://..."
          />
          <Form.Select
            field="fetch.method"
            label={t('request_method')}
            optionList={METHOD_LIST}
          />
          <Form.Slot label={t('request_headers')}>
            <HeaderField field="editHeader" type="request" />
          </Form.Slot>
          <Form.TextArea
            field="fetch.body"
            label={t('request_body')}
            placeholder={t('request_body_placeholder')}
            rows={4}
          />
          <Form.Select
            field="fetch.responseType"
            label={t('response_type')}
            optionList={[
              { label: t('response_type_json'), value: 'json' },
              { label: t('response_type_text'), value: 'text' },
            ]}
          />
          <CodeEditorField
            field="fetch.validator"
            label={t('validator')}
            height="200px"
          />
        </>
      ) : (
        <CodeEditorField field="code" label={t('code')} height="300px" />
      )}
    </>
  );
};

const Edit = ({ visible, task: taskProp, onClose }: EditProps) => {
  const formApi = useRef<FormApi>();

  const isEdit = Boolean(taskProp?.key);

  const initInput = useMemo(() => {
    const task = taskProp || EMPTY_TASK;
    return task;
  }, [taskProp]);

  useEffect(() => {
    formApi.current?.reset();
    formApi.current?.setValues(initInput);
  }, [initInput]);

  const { run: doSubmit, loading } = useRequest(
    async () => {
      if (!formApi.current) {
        throw new Error('No form api');
      }
      const task = getTaskFromInput(formApi.current.getValues());

      // 基本验证
      if (!task.key) {
        throw new Error(t('task_key_empty'));
      }
      if (!/^[a-zA-Z]/.test(task.key) || !/^([a-zA-Z0-9_]+)$/.test(task.key)) {
        throw new Error(t('task_key_invalid'));
      }

      // 基本验证
      if (!task.name) {
        throw new Error(t('task_name_empty'));
      }

      if (task.execute === 'cron') {
        if (!task.cron) {
          throw new Error(t('cron_expression_empty'));
        }
        try {
          const c = new Cron(task.cron);
          c.nextRun();
        } catch (_) {
          throw new Error(t('cron_expression_invalid'));
        }
      }

      if (
        task.execute === 'interval' &&
        (!task.interval || task.interval <= 0)
      ) {
        throw new Error(t('interval_empty'));
      }

      if (task.isFunction && !task.code) {
        throw new Error(t('code_empty'));
      }

      // 如果不是函数执行，则必须有 fetch 配置
      if (!task.fetch) {
        throw new Error(t('fetch_url_invalid'));
      }

      const { url, method, validator, responseType } = task.fetch;

      if (!url || !/https?:\/\/.+/.test(url)) {
        throw new Error(t('fetch_url_invalid'));
      }
      if (!method) {
        throw new Error(t('fetch_method_empty'));
      }
      if (!responseType) {
        throw new Error(t('response_type_empty'));
      }
      if (validator) {
        try {
          applyJsonLogic(validator, {});
        } catch (_) {
          throw new Error(t('validator_invalid'));
        }
      }

      // 保存任务
      console.log(task);
      // throw new Error(t('success'));
      return Api.saveTask(task);
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
        <Form.Input
          field="key"
          label={t('task_key')}
          placeholder={t('task_key_placeholder')}
        />

        <Form.Input
          field="name"
          label={t('task_name')}
          placeholder={t('task_name_placeholder')}
        />

        <Form.Select
          field="execute"
          label={t('task_execute_type')}
          optionList={[
            { label: t('task_execute_once'), value: 'once' },
            { label: t('task_execute_interval'), value: 'interval' },
            { label: t('task_execute_cron'), value: 'cron' },
          ]}
        />

        <ExecutionConfig />

        <BoolRadioGroupField
          field="isFunction"
          label={t('exec_type')}
          options={[
            { label: t('exec_normal'), value: false },
            { label: t('exec_function'), value: true },
          ]}
        />

        <TaskConfig />
      </Form>
    </SideSheet>
  );
};

export default Edit;
