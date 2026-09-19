import { TABLE_NAMES_ARR } from '@/share/core/constant';
import { createExport } from '@/share/core/rule-utils';
import type { Rule } from '@/share/core/types';
import { getTableName } from '@/share/core/utils';
import file from '@/share/pages/file';
import { getExportName } from '../../utils';

export { remove, save, toggleRule } from '@/share/pages/rule-utils';

export function batchShare(rules: Rule[]) {
  const result: any = {};
  TABLE_NAMES_ARR.forEach(tb => {
    result[tb] = [];
  });
  rules.forEach(e => result[getTableName(e.ruleType)].push(e));
  file.save(JSON.stringify(createExport(result), null, '\t'), getExportName());
}
