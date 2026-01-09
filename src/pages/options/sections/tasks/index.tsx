import {
  IconDelete,
  IconEdit,
  IconPlay,
  IconPlusCircle,
  IconRefresh,
} from '@douyinfe/semi-icons';
import {
  Button,
  ButtonGroup,
  Card,
  Form,
  List,
  Space,
  Spin,
  Tag,
  TextArea,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { useEffect, useState } from 'react';
import Modal from '@/share/components/modal';
import { EVENTs } from '@/share/core/constant';
import notify from '@/share/core/notify';
import type { Task } from '@/share/core/types';
import { t } from '@/share/core/utils';
import Api from '@/share/pages/api';
import { Layout } from '../layout';
import Edit from './edit';
import { EMPTY_TASK } from './utils';

const style = css`
  .semi-card-body {
    padding: 0;
  }
  .list-item {
    .title {
      display: block;
      font-weight: bold;
    }
    .content {
      font-size: 12px;
    }
  }
`;

const renderLastRun = (task: Task) => {
  if (!task.lastRun) {
    return null;
  }
  if (task.lastRun.status === 'done') {
    const { result, time } = task.lastRun;
    return (
      <span
        style={{ cursor: 'pointer' }}
        onClick={() =>
          Modal.info({
            title: t('task_last_run'),
            content: (
              <>
                <Form.Slot label={t('time')}>
                  {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
                </Form.Slot>
                <Form.Slot label={t('result')}>
                  <TextArea
                    rows={10}
                    value={
                      typeof result === 'string'
                        ? result
                        : JSON.stringify(result, null, 2)
                    }
                  />
                </Form.Slot>
              </>
            ),
            hasCancel: false,
          })
        }
      >
        {t('task_run_success')}
      </span>
    );
  }
  if (task.lastRun.status === 'error') {
    const { error, time } = task.lastRun;
    return (
      <span
        style={{ cursor: 'pointer' }}
        onClick={() =>
          Modal.info({
            title: t('task_last_run'),
            content: (
              <>
                <Form.Slot label={t('time')}>
                  {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
                </Form.Slot>
                <Form.Slot label={t('task_run_error')}>
                  <pre>{error}</pre>
                </Form.Slot>
              </>
            ),
            hasCancel: false,
          })
        }
      >
        {t('task_run_error')}
      </span>
    );
  }
  if (task.lastRun.status === 'running') {
    return <span>{t('task_running')}</span>;
  }
};

const Tasks = () => {
  const [edit, setEdit] = useState<Task | undefined>(undefined);

  const {
    data: tasks,
    loading,
    refresh,
  } = useRequest(Api.getTasks, {
    manual: false,
  });

  useEffect(() => {
    notify.event.on(EVENTs.TASK_SAVE, refresh);
    notify.event.on(EVENTs.TASK_DELETE, refresh);

    return () => {
      notify.event.off(EVENTs.TASK_SAVE, refresh);
      notify.event.off(EVENTs.TASK_DELETE, refresh);
    };
  }, []);

  return (
    <Layout
      title={t('tasks')}
      extra={
        <Space>
          <Button
            theme="light"
            type="tertiary"
            icon={<IconRefresh />}
            onClick={refresh}
          >
            {t('refresh')}
          </Button>
          <Button
            type="primary"
            theme="solid"
            icon={<IconPlusCircle />}
            onClick={() => setEdit(cloneDeep(EMPTY_TASK))}
          >
            {t('add')}
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Card className={style}>
          <List
            dataSource={tasks}
            renderItem={task => (
              <List.Item
                key={task.key}
                main={
                  <div className="list-item">
                    <Typography.Text className="title">
                      <Space>
                        <Tag
                          color="grey"
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            navigator.clipboard.writeText(task.key)
                          }
                        >
                          {task.key}
                        </Tag>
                        {task.name}
                      </Space>
                    </Typography.Text>
                    <Typography.Text type="quaternary" className="content">
                      <Space>
                        <span>
                          {t('last_run', {
                            time: task.lastRun
                              ? dayjs(task.lastRun.time).format(
                                  'YYYY-MM-DD HH:mm:ss',
                                )
                              : t('task_not_run'),
                          })}
                        </span>
                        {renderLastRun(task)}
                        <span>{t(`task_execute_${task.execute}`)}</span>
                      </Space>
                    </Typography.Text>
                  </div>
                }
                extra={
                  <ButtonGroup>
                    <Tooltip content={t('edit')}>
                      <Button
                        theme="borderless"
                        type="tertiary"
                        onClick={() => setEdit(task)}
                        icon={<IconEdit />}
                      />
                    </Tooltip>
                    <Tooltip content={t('run')}>
                      <Button
                        theme="borderless"
                        type="tertiary"
                        disabled={task.lastRun?.status === 'running'}
                        onClick={() => Api.runTask(task.key).then(refresh)}
                        icon={<IconPlay />}
                      />
                    </Tooltip>
                    <Tooltip content={t('delete')}>
                      <Button
                        theme="borderless"
                        type="tertiary"
                        onClick={() => {
                          Modal.warning({
                            title: t('delete_task_confirm'),
                            onOk: () => Api.removeTask(task.key).then(refresh),
                          });
                        }}
                        icon={<IconDelete />}
                      />
                    </Tooltip>
                  </ButtonGroup>
                }
              />
            )}
          />
        </Card>
      </Spin>
      <Edit
        visible={Boolean(edit)}
        task={edit}
        onClose={() => setEdit(undefined)}
      />
    </Layout>
  );
};
export default Tasks;
