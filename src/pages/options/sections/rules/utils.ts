import Api from '@/share/core/api';
import emitter from '@/share/core/emitter';
import file from '@/share/core/file';
import { createExport } from '@/share/core/ruleUtils';
import { getTableName } from '@/share/core/utils';
import { InitdRule, Rule, TABLE_NAMES } from '@/share/core/var';
import { getExportName } from '../../utils';

emitter.on(emitter.INNER_GROUP_CANCEL, () => emitter.removeAllListeners(emitter.INNER_GROUP_SELECTED));
export function selectGroup(selected?: string): Promise<string> {
  return new Promise(resolve => {
    emitter.emit(emitter.ACTION_SELECT_GROUP, selected);
    emitter.once(emitter.INNER_GROUP_SELECTED, resolve);
  });
}

export function toggleRule(rule: InitdRule, enable: boolean) {
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
  TABLE_NAMES.forEach((tb) => {
    result[tb] = [];
  });
  rules.forEach((e) => result[getTableName(e.ruleType)].push(e));
  file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
}
