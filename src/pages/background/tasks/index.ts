import { Cron } from 'croner';
import { alarms } from 'webextension-polyfill';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import type { Task } from '@/share/core/types';
import {
  getTask,
  getTasks,
  loadTaskRun,
  removeTaskRun,
  runTaskAndSave,
} from './core';

export async function checkOneTask(task: Task) {
  const data = await loadTaskRun(task.key);
  if (!data) {
    return runTaskAndSave(task);
  }

  if (task.execute === 'once') {
    // once task do not need alarm
    return;
  }

  const alarmKey = `task_${task.key}`;
  const alarm = await alarms.get(alarmKey);

  if (task.execute === 'interval' && task.interval) {
    if (alarm) {
      return;
    }
    logger.debug('[task] create interval alarm', alarmKey, task);
    alarms.create(alarmKey, {
      delayInMinutes: task.interval,
      periodInMinutes: task.interval,
    });
  }

  if (task.execute === 'cron' && task.cron) {
    let nextDate: Date | null = null;
    try {
      const cron = new Cron(task.cron);
      nextDate = cron.nextRun();
    } catch (e) {
      console.error(e);
    }
    if (nextDate) {
      if (alarm?.scheduledTime === nextDate.getTime()) {
        return;
      }
      if (alarm) {
        await alarms.clear(alarmKey);
      }
      logger.debug('[task] create cron alarm', alarmKey, nextDate);
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
