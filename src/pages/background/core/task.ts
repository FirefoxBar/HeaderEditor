import { apply as applyJsonLogic } from 'json-logic-js';
import { cloneDeep, pick } from 'lodash-es';
import { TABLE_NAME_TASKS } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import { getLocal, getSession, readStorage } from '@/share/core/storage';
import type { Task, TaskRun } from '@/share/core/types';
import { sleep } from '@/share/core/utils';
import { getDatabase } from '../core/db';
import { pifyIDBRequest } from '../utils';
import { basicHelper, createStorage } from './function-helper';

const validTaskRun: Record<string, TaskRun> = {};
const lastTaskRun: Record<string, TaskRun> = {};

const cachedTasks: Record<string, Task> = {};

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
      const t: Task = cursor.value;
      all.push(t);
      if (!cachedTasks[t.key]) {
        cachedTasks[t.key] = t;
      }
      cursor.continue();
    };
  });
}

export async function getTask(key: string): Promise<Task | null> {
  if (cachedTasks[key]) {
    return cachedTasks[key];
  }

  const db = await getDatabase();

  const tx = db.transaction([TABLE_NAME_TASKS], 'readonly');
  const os = tx.objectStore(TABLE_NAME_TASKS);

  const res = await pifyIDBRequest(os.get(key));
  if (res) {
    cachedTasks[key] = res;
  }
  return res;
}

export async function saveTask(taskInfo: Task) {
  const db = await getDatabase();

  const tx = db.transaction([TABLE_NAME_TASKS], 'readwrite');
  const os = tx.objectStore(TABLE_NAME_TASKS);

  const exists = await pifyIDBRequest(os.get(taskInfo.key));
  if (exists) {
    const original = cloneDeep(exists);
    const copy = pick(
      taskInfo,
      'key',
      'name',
      'execute',
      'cron',
      'interval',
      'isFunction',
      'fetch',
      'code',
    );
    Object.assign(original, copy);
    await pifyIDBRequest(os.put(original));
    emitter.emit(emitter.INNER_TASK_UPDATE, { task: original });
    if (cachedTasks[taskInfo.key]) {
      cachedTasks[taskInfo.key] = taskInfo;
    }
    return original;
  }

  // Create
  await pifyIDBRequest(os.add(taskInfo));
  emitter.emit(emitter.INNER_TASK_UPDATE, { task: taskInfo });
  if (cachedTasks[taskInfo.key]) {
    cachedTasks[taskInfo.key] = taskInfo;
  }
  return taskInfo;
}

export async function removeTask(key: string) {
  const db = await getDatabase();
  const tx = db.transaction([TABLE_NAME_TASKS], 'readwrite');
  const os = tx.objectStore(TABLE_NAME_TASKS);
  await pifyIDBRequest(os.delete(key));
  removeTaskRun(key);
  if (cachedTasks[key]) {
    delete cachedTasks[key];
  }
  if (validTaskRun[key]) {
    delete validTaskRun[key];
  }
  if (lastTaskRun[key]) {
    delete lastTaskRun[key];
  }
  if ('getKeys' in getLocal()) {
    // remove storage
    getLocal()
      .getKeys()
      .then(keys => {
        const k = keys.filter(key => key.startsWith(`f#t#${key}#`));
        if (k.length > 0) getLocal().remove(k);
      });
  }
  emitter.emit(emitter.INNER_TASK_REMOVE, { key });
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
    if (!task._func) {
      task._func = new Function(`return async function() { ${task.code} }`)();
    }
    try {
      return onSuccess(
        await task._func!.call({
          ...basicHelper,
          sessionStorage: createStorage(`t#${task.key}`, getSession()),
          localStorage: createStorage(`t#${task.key}`, getLocal()),
        }),
      );
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
