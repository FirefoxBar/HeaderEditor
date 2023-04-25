import Api from '@/share/pages/api';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import file from '@/share/pages/file';
import { createExport } from '@/share/core/rule-utils';
import { getTableName } from '@/share/core/utils';
import type { Rule } from '@/share/core/types';
import { getExportName } from '../../utils';

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

export function batchShare(rules: Rule[]) {
  const result: any = {};
  TABLE_NAMES_ARR.forEach((tb) => {
    result[tb] = [];
  });
  rules.forEach((e) => result[getTableName(e.ruleType)].push(e));
  file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
}
