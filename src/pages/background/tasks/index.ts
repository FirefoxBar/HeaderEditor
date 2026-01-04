import { Cron } from 'croner';
import { alarms } from 'webextension-polyfill';
import emitter from '@/share/core/emitter';
import type { Task } from '@/share/core/types';
import {
  getTask,
  getTaskRun,
  getTasks,
  removeTaskRun,
  runTaskAndSave,
} from './core';

export async function checkOneTask(task: Task) {
  const data = await getTaskRun(task.key);
  if (!data) {
    runTaskAndSave(task);
  }

  if (task.execute === 'once') {
    return;
  }

  const alarmKey = `task_${task.key}`;
  const alarm = await alarms.get(alarmKey);

  if (task.execute === 'interval' && task.interval) {
    if (alarm) {
      return;
    }
    alarms.create(alarmKey, {
      delayInMinutes: task.interval,
      periodInMinutes: task.interval,
    });
  }
  if (task.execute === 'cron' && task.cron) {
    const cron = new Cron(task.cron);
    const nextDate = cron.nextRun();
    if (nextDate) {
      if (alarm?.scheduledTime === nextDate.getTime()) {
        return;
      }
      if (alarm) {
        await alarms.clear(alarmKey);
      }
      alarms.create(alarmKey, {
        when: nextDate.getTime(),
      });
    }
  }
}

export async function checkAllTasks() {
  const tasks = await getTasks();

  tasks.forEach(checkOneTask);
}

export function init() {
  alarms.onAlarm.addListener(async alarm => {
    if (!alarm.name.startsWith('task_')) {
      return;
    }
    const task = await getTask(alarm.name.substring(5));
    if (task) {
      await removeTaskRun(task.key);
      await runTaskAndSave(task);
    }
  });

  emitter.on(emitter.INNER_TASK_REMOVE, async (key: string) => {
    await removeTaskRun(key);
    await alarms.clear(`task_${key}`);
  });

  emitter.on(emitter.INNER_TASK_UPDATE, async (task: Task) => {
    await checkOneTask(task);
  });

  checkAllTasks();
}
