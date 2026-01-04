import { apply as applyJsonLogic } from 'json-logic-js';
import { TABLE_NAME_TASKS } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { getSession, readStorage } from '@/share/core/storage';
import type { Task, TaskRun } from '@/share/core/types';
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
      validTaskRun[key] = run;
    }
    return run;
  }
  return undefined;
}

export async function runTask(task: Task) {
  const result: TaskRun = {
    key: task.key,
    time: Date.now(),
    status: 'running',
  };
  lastTaskRun[task.key] = result;

  if (task.isFunction && task.code && ENABLE_EVAL) {
    try {
      const fn = new Function(`return async function() { ${task.code} }`)();
      result.result = await fn();
      result.status = 'done';
      validTaskRun[task.key] = result;
      emitter.emit(emitter.INNER_TASK_RUN, task, result);
    } catch (e) {
      result.status = 'error';
      result.error = (e as Error).message;
    }
    return result;
  }

  if (task.fetch) {
    try {
      const res = await fetch(task.fetch.url, {
        method: task.fetch.method || 'GET',
        headers: task.fetch.headers,
        body: task.fetch.body,
      });
      if (task.fetch.responseType === 'text') {
        result.result = await res.text();
      }
      if (task.fetch.responseType === 'json') {
        result.result = await res.json();
      }
      const validator = task.fetch.validator;
      if (validator) {
        const validateResult = applyJsonLogic(validator, {
          type: res.type,
          status: res.status,
          body: result.result,
        });
        if (!validateResult) {
          result.status = 'error';
          result.error = 'Validation failed';
          return result;
        }
      }
      result.status = 'done';
      validTaskRun[task.key] = result;
      emitter.emit(emitter.INNER_TASK_RUN, task, result);
    } catch (e) {
      result.status = 'error';
      result.error = (e as Error).message;
    }
    return result;
  }

  result.status = 'error';
  result.error = 'Unknown task type';
  return result;
}

export function removeTaskRun(taskKey: string) {
  return getSession().remove(`taskRun_${taskKey}`);
}

export async function runTaskAndSave(task: Task) {
  const result = await runTask(task);
  if (result.status === 'done') {
    validTaskRun[task.key] = result;
  }
  await getSession().set({
    [`taskRun_${task.key}`]: result,
  });
  return result;
}
