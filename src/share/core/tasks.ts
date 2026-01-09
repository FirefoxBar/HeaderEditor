import { RULE_TYPE } from './constant';
import type { Rule } from './types';

function getTaskUsage(text: string) {
  if (!text.includes('{$TASK.')) {
    return [];
  }
  // 形似 {$TASK.task_key.PATH}
  const matches = text.match(/\{\$TASK\.([^}]+)\}/g);
  if (!matches) {
    return [];
  }
  return matches.map(x => x.substring(7, x.indexOf('.')));
}

export function getRuleUsedTasks(rule: Rule): Set<string> {
  switch (rule.ruleType) {
    case RULE_TYPE.CANCEL:
      return new Set();
    case RULE_TYPE.MODIFY_SEND_HEADER:
    case RULE_TYPE.MODIFY_RECV_HEADER:
      return new Set(
        Object.values(rule.headers || {}).flatMap(x => getTaskUsage(x)),
      );
    case RULE_TYPE.REDIRECT:
      return new Set(getTaskUsage(rule.to || ''));
    case RULE_TYPE.MODIFY_RECV_BODY:
      return new Set(getTaskUsage(rule.body?.value || ''));
  }
}

export function getRulesUsedTasks(rules: Rule[]) {
  return new Set(rules.flatMap(x => Array.from(getRuleUsedTasks(x))));
}
