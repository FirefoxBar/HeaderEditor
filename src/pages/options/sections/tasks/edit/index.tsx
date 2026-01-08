import { Form, useFormState } from '@douyinfe/semi-ui';
import { Cron } from 'croner';
import { apply as applyJsonLogic } from 'json-logic-js';
import { METHOD_LIST } from '@/pages/options/constant';
import { BoolRadioGroupField } from '@/share/components/bool-radio';
import { CodeEditorField } from '@/share/components/code-editor';
import HeaderField from '@/share/components/header-field';
import SideEdit from '@/share/components/side-edit';
import type { Task } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import {
  EMPTY_TASK,
  getInput,
  getTaskFromInput,
  type TaskInput,
} from '../utils';

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
const RequestConfig = () => {
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

const RetryConfig = () => {
  const { values } = useFormState();

  return (
    <>
      <BoolRadioGroupField
        field="shouldRetry"
        label={t('retry')}
        options={[
          { label: t('no'), value: false },
          { label: t('yes'), value: true },
        ]}
      />
      {values.shouldRetry && (
        <>
          <Form.InputNumber field="retry.max" label={t('retry_max')} min={1} />
          <Form.InputNumber
            field="retry.wait"
            label={t('retry_wait')}
            min={1}
          />
        </>
      )}
    </>
  );
};

const validateTask = async (task: Task) => {
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

  if (task.execute === 'interval' && (!task.interval || task.interval <= 0)) {
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

  if (task.retry) {
    if (!task.retry.max || task.retry.max <= 0) {
      throw new Error(t('retry_max_invalid'));
    }
    if (!task.retry.wait || task.retry.wait <= 0) {
      throw new Error(t('retry_wait_invalid'));
    }
  }
};

const Edit = ({ visible, task, onClose }: EditProps) => {
  const isEdit = Boolean(task?.key);

  return (
    <SideEdit<Task, TaskInput>
      visible={visible}
      onClose={onClose}
      value={task}
      defaultValue={EMPTY_TASK}
      getInput={getInput}
      getValue={getTaskFromInput}
      onSave={Api.saveTask}
      validate={validateTask}
      isEdit={isEdit}
    >
      <Form.Input field="key" label={t('task_key')} disabled={isEdit} />

      <Form.Input field="name" label={t('task_name')} />

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

      <RequestConfig />

      <RetryConfig />
    </SideEdit>
  );
};

export default Edit;
