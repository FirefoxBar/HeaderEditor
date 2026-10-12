import { RE2JS } from 're2js';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import { createExport, detectRunner } from '@/share/core/rule-utils';
import type { InitdRule, Rule } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
import { save as saveFile } from '@/share/pages/file';
import { getExportName } from '../../utils';

export { remove, save, toggleRule } from '@/share/pages/rule-utils';

/**
 * 为 DNR 规则编译 RE2，用于模拟运行时的正则语义
 *
 * 仅在 ENABLE_DNR 且规则实际走 DNR 时才需要，其他情况会回退到 _reg（JS RegExp）。
 *
 * @returns 编译失败时返回错误，调用方可据此降级为 web_request
 */
export function compileRe2(initd: InitdRule): Error | undefined {
  if (!ENABLE_DNR || !initd.condition?.regex || detectRunner(initd) !== 'dnr') {
    return;
  }
  try {
    initd._re2 = RE2JS.compile(initd.condition.regex);
  } catch (e) {
    return e as Error;
  }
}

export function batchShare(rules: Rule[]) {
  const result: any = {};
  TABLE_NAMES_ARR.forEach(tb => {
    result[tb] = [];
  });
  rules.forEach(e => result[getTableName(e.ruleType)].push(e));
  saveFile(JSON.stringify(createExport(result), null, '\t'), getExportName());
}
