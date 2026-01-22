import { TABLE_NAMES_ARR } from '@/share/core/constant';
import type { Rule, Task } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
import Api from '@/share/pages/api';
import file from '@/share/pages/file';
import { createExport, getExportName } from '../../utils';

export function toggleRule(rule: Rule, enable: boolean) {
  rule.enable = enable;
  return Api.saveRule(rule);
}

export function remove(rule: Rule) {
  const table = getTableName(rule.ruleType);
  return table ? Api.removeRule(table, rule.id) : Promise.resolve();
}

export function save(rule: Rule) {
  return Api.saveRule(rule);
}

export async function batchShare(rules: Rule[], tasks?: Task[]) {
  const result: any = {};
  TABLE_NAMES_ARR.forEach(tb => {
    result[tb] = [];
  });
  rules.forEach(e => result[getTableName(e.ruleType)].push(e));
  if (tasks) {
    result.tasks = {};
    tasks.forEach(x => (result.tasks[x.key] = x));
  }
  file.save(
    JSON.stringify(await createExport(result), null, '\t'),
    getExportName(),
  );
}
