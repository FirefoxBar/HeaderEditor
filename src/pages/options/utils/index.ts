import dayjs from 'dayjs';
import emitter from '@/share/core/emitter';
import { convertToBasicRule } from '@/share/core/rule-utils';
import { collectRulesUsedTasks } from '@/share/core/tasks';
import type { InitdRule, Rule, Task } from '@/share/core/types';
import Api from '@/share/pages/api';

export function getExportName(additional?: string) {
  const date = dayjs().format('YYYYMMDD_HHmmss');
  return `HE_${date}${additional ? '_' + additional : ''}.json`;
}

export async function createTaskExport(task: Task) {
  if (task.isFunction && task.code) {
  }
}

export async function createExport(arr: {
  [key: string]: Array<Rule | InitdRule>;
}) {
  const result: any = {};
  const tasks = new Set<string>();
  Object.keys(arr).forEach(k => {
    result[k] = arr[k].map(e => convertToBasicRule(e));
    const t = collectRulesUsedTasks(arr[k]);
    t.forEach(e => tasks.add(e));
  });
  // 一并导出任务
  if (tasks.size) {
    const allTasks = await Api.getTasks();
    result.tasks = Object.fromEntries(
      (
        Array.from(tasks)
          .map(x => allTasks.find(y => y.key === x))
          .filter(Boolean) as Task[]
      ).map(x => {
        delete x.lastRun;
        delete x._func;
        return [x.key, x];
      }),
    );
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
