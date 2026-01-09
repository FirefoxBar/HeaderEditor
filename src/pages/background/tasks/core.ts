import { apply as applyJsonLogic } from 'json-logic-js';
import { TABLE_NAME_TASKS } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { getSession, readStorage } from '@/share/core/storage';
import type { Task, TaskRun } from '@/share/core/types';
import { sleep } from '@/share/core/utils';
import { getDatabase } from '../core/db';
import { pifyIDBRequest } from '../utils';

const validTaskRun: Record<string, TaskRun> = {};
const lastTaskRun: Record<string, TaskRun> = {};

export function getValidTaskRun(key: string) {
  return validTaskRun[key];
}

export function getLastTaskRun(key: string) {
  return lastTaskRun[key];
}

export async function getTasks(): Promise<Task[]> {
  const db = await getDatabase();

  const tx = db.transaction([TABLE_NAME_TASKS], 'readonly');
  const os = tx.objectStore(TABLE_NAME_TASKS);
  const all: Task[] = [];

  return new Promise(resolve => {
    os.openCursor().onsuccess = event => {
      const cursor: IDBCursorWithValue = (event.target as any)?.result;
      if (!cursor) {
        resolve(all);
        return;
      }
      all.push(cursor.value);
      cursor.continue();
    };
  });
}

export async function getTask(key: string): Promise<Task | null> {
  const db = await getDatabase();

  const tx = db.transaction([TABLE_NAME_TASKS], 'readonly');
  const os = tx.objectStore(TABLE_NAME_TASKS);

  return pifyIDBRequest(os.get(key));
}

export async function loadTaskRun(key: string): Promise<TaskRun | undefined> {
  const run = await readStorage<TaskRun>(getSession(), `taskRun_${key}`);
  if (run) {
    if (run.status === 'done') {
      logger.debug('[task] load task run from storage', key, run);
      validTaskRun[key] = run;
    }
    return run;
  }
  return undefined;
}

export async function runTask(task: Task) {
  logger.debug('[task] runTask', task);
  const result: TaskRun = {
    key: task.key,
    time: Date.now(),
    status: 'running',
  };
  lastTaskRun[task.key] = result;

  const onSuccess = (taskRes: any) => {
    logger.debug('[task] runTask success', task, taskRes);
    result.status = 'done';
    result.result = taskRes;
    validTaskRun[task.key] = result;
    emitter.emit(emitter.INNER_TASK_RUN, task, result);
    return result;
  };

  const onError = (error: string) => {
    logger.debug('[task] runTask error', task, error);
    result.status = 'error';
    result.error = error;
    return result;
  };

  if (task.isFunction && task.code && ENABLE_EVAL) {
    try {
      const fn = new Function(`return async function() { ${task.code} }`)();
      return onSuccess(await fn());
    } catch (e) {
      return onError((e as Error).message);
    }
  }

  if (task.fetch) {
    try {
      const res = await fetch(task.fetch.url, {
        method: task.fetch.method || 'GET',
        headers: task.fetch.headers,
        body: task.fetch.body,
      });
      let taskRes: any;
      if (task.fetch.responseType === 'json') {
        taskRes = await res.json();
      } else {
        taskRes = await res.text();
      }
      const validator = task.fetch.validator;
      if (validator) {
        const validateResult = applyJsonLogic(validator, {
          type: res.type,
          status: res.status,
          body: taskRes,
        });
        if (!validateResult) {
          return onError('Validation failed');
        }
      }
      return onSuccess(taskRes);
    } catch (e) {
      return onError((e as Error).message);
    }
  }

  return onError('Unknown task type');
}

export function removeTaskRun(taskKey: string) {
  return getSession().remove(`taskRun_${taskKey}`);
}

export async function runTaskAndSave(task: Task) {
  let result: any;
  let count = task.retry?.max || 1;
  const wait = 1000 * (task.retry?.wait || 0);
  while (count--) {
    try {
      result = await runTask(task);
      if (result.status === 'done') {
        break;
      }
    } catch (e) {
      logger.debug('[task] runTask error', task, e);
      if (wait > 0) {
        await sleep(wait);
      }
    }
  }
  if (result.status === 'done') {
    logger.debug('[task] save taskRun storage', task, result);
    await getSession().set({
      [`taskRun_${task.key}`]: result,
    });
    return result;
  }
}
