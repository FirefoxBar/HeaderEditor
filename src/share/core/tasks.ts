import { RULE_TYPE } from './constant';
import type { Rule } from './types';

function collectTaskUsage(text: string) {
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

export function collectTaskFromCode(code: string) {
  const res = new Set<string>();
  ['get', 'getLastRun', 'getValidRun'].forEach(func => {
    const regex = new RegExp(
      `task\.${func}\\s*\\(\\s*['"]?([^'"]+)['"]?\\s*\\)`,
    );
    const r = code.matchAll(regex);
    r.forEach(m => {
      res.add(m[1]);
    });
  });
  return res;
}

export function collectRuleUsedTasks(rule: Rule): Set<string> {
  const simpleCollect = (): Set<string> => {
    if (rule.isFunction && rule.code) {
      return collectTaskFromCode(rule.code);
    }

    switch (rule.ruleType) {
      case RULE_TYPE.CANCEL:
        return new Set();
      case RULE_TYPE.MODIFY_SEND_HEADER:
      case RULE_TYPE.MODIFY_RECV_HEADER:
        return new Set(
          Object.values(rule.headers || {}).flatMap(x => collectTaskUsage(x)),
        );
      case RULE_TYPE.REDIRECT:
        return new Set(collectTaskUsage(rule.to || ''));
      case RULE_TYPE.MODIFY_RECV_BODY:
        return new Set(collectTaskUsage(rule.body?.value || ''));
    }
  };

  // TODO: deep collect

  return simpleCollect();
}

export function collectRulesUsedTasks(rules: Rule[]) {
  return new Set(rules.flatMap(x => Array.from(collectRuleUsedTasks(x))));
}
