import { Toast } from '@douyinfe/semi-ui';
import { RE2JS } from 're2js';
import { t } from '@/share/core/browser';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import {
  createExport,
  detectRunner,
  isIgnoreCase,
} from '@/share/core/rule-utils';
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
    initd._re2 = RE2JS.compile(
      initd.condition.regex,
      isIgnoreCase(initd) ? RE2JS.CASE_INSENSITIVE : 0,
    );
  } catch (e) {
    return e as Error;
  }
}

/**
 * 生成分享用的 JSON，与导出的文件格式一致，可直接通过「粘贴JSON」导入。
 * 单条规则与批量规则共用此方法，保证产物格式完全一致。
 */
export function createShareJson(rules: Rule[]) {
  const result: { [key: string]: Rule[] } = {};
  TABLE_NAMES_ARR.forEach(tb => {
    result[tb] = [];
  });
  rules.forEach(e => result[getTableName(e.ruleType)].push(e));
  return JSON.stringify(createExport(result), null, '\t');
}

export function batchShare(rules: Rule[]) {
  saveFile(createShareJson(rules), getExportName());
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // 无权限或非安全上下文时降级到 execCommand
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!copied) {
    throw new Error('Copy to clipboard failed');
  }
}

/** 将规则以 JSON 格式复制到剪贴板 */
export async function copyAsJson(rules: Rule[]) {
  try {
    await writeClipboard(createShareJson(rules));
    Toast.success(t('copy_success'));
  } catch {
    Toast.error(t('copy_failed'));
  }
}
