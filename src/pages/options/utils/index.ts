import dayjs from 'dayjs';
import { TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import { convertToBasicRule } from '@/share/core/rule-utils';
import { collectRulesUsedTasks } from '@/share/core/tasks';
import type { InitdRule, Rule, Task } from '@/share/core/types';
import Api from '@/share/pages/api';

export function getExportName(additional?: string) {
  const date = dayjs().format('YYYYMMDD_HHmmss');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}

export function createTaskExport(x: Task) {
  delete x.lastRun;
  delete x._func;
  return x;
}

export async function createExport(
  arr: Partial<{
    [TABLE_NAMES.receiveHeader]: Array<Rule | InitdRule>;
    [TABLE_NAMES.receiveBody]: Array<Rule | InitdRule>;
    [TABLE_NAMES.request]: Array<Rule | InitdRule>;
    [TABLE_NAMES.sendHeader]: Array<Rule | InitdRule>;
    tasks: Record<string, Task>;
  }>,
) {
  const result: any = {};
  const tasks = new Set<string>();

  TABLE_NAMES_ARR.forEach(tb => {
    if (!arr[tb]) {
      return;
    }
    result[tb] = arr[tb].map(e => convertToBasicRule(e));
    const t = collectRulesUsedTasks(arr[tb]);
    t.forEach(e => tasks.add(e));
  });

  // 一并导出任务
  if (tasks.size || arr.tasks) {
    const allTasks = await Api.getTasks();
    if (!result.tasks) {
      result.tasks = {};
    }
    if (arr.tasks) {
      Object.keys(arr.tasks).forEach(x => {
        result.tasks[x] = createTaskExport(arr.tasks![x]);
      });
    }
    const tasksArr = Array.from(tasks)
      .map(x => allTasks.find(y => y.key === x))
      .filter(Boolean) as Task[];
    tasksArr.forEach(x => {
      if (result.tasks[x.key]) {
        return;
      }
      result.tasks[x.key] = createTaskExport(x);
    });
  }
  return result;
}

emitter.on(emitter.INNER_GROUP_CANCEL, () =>
  emitter.removeAllListeners(emitter.INNER_GROUP_SELECTED),
);
export function selectGroup(selected?: string): Promise<string> {
  return new Promise(resolve => {
    emitter.emit(emitter.ACTION_SELECT_GROUP, selected);
    emitter.once(emitter.INNER_GROUP_SELECTED, resolve);
  });
}
