import Api from 'share/core/api';
import { InitedRule, Rule } from 'share/core/var';
import { getTableName } from 'share/core/utils';

export function toggleRule(rule: InitedRule, enable: boolean) {
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
