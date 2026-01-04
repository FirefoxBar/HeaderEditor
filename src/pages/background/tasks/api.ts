import { cloneDeep, pick } from 'lodash-es';
import { TABLE_NAME_TASKS } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import type { Task } from '@/share/core/types';
import { getDatabase } from '../core/db';
import { pifyIDBRequest } from '../utils';
import {
  getTask,
  getTaskRun,
  getTasks as innerGetTasks,
  runTaskAndSave,
} from './core';

export async function runTask(key: string) {
  const task = await getTask(key);
  if (task) {
    return runTaskAndSave(task);
  }
}

export async function saveTask(taskInfo: Task) {
  const db = await getDatabase();

  const tx = db.transaction([TABLE_NAME_TASKS], 'readwrite');
  const os = tx.objectStore(TABLE_NAME_TASKS);

  const exists = await pifyIDBRequest(os.get(Number(taskInfo.key)));
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
    return original;
  }

  // Create
  await pifyIDBRequest(os.add(taskInfo));
  emitter.emit(emitter.INNER_TASK_UPDATE, { task: taskInfo });
  return taskInfo;
}

export async function removeTask(key: string) {
  const db = await getDatabase();
  const tx = db.transaction([TABLE_NAME_TASKS], 'readwrite');
  const os = tx.objectStore(TABLE_NAME_TASKS);
  await pifyIDBRequest(os.delete(Number(key)));
  emitter.emit(emitter.INNER_TASK_REMOVE, { key });
}

export async function getTasks() {
  const result = await innerGetTasks();

  const run = (await Promise.all(result.map(x => getTaskRun(x.key)))).filter(
    Boolean,
  );

  result.forEach(task => (task.lastRun = run.find(x => x!.key === task.key)));

  return result;
}
