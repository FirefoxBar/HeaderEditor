import browser from 'webextension-polyfill';
import { prefs } from './prefs';
import type { Rule, RuleSortOrder } from './types';

/**
 * 名称排序统一使用 Intl.Collator，规则名与分组名共用同一套比较规则。
 * locale 跟随扩展界面语言；numeric 让 "Rule 2" 排在 "Rule 10" 之前；
 * sensitivity: 'base' 使大小写与重音差异不影响排序结果。
 */
const nameCollator = new Intl.Collator(browser.i18n.getUILanguage(), {
  numeric: true,
  sensitivity: 'base',
});

export function compareNames(a: string, b: string) {
  return nameCollator.compare(a, b);
}

/**
 * 读取排序设置。prefs 从 storage 加载是异步的，页面刚打开时直接读取
 * 只能拿到默认值，会让自定义排序失效。
 */
export function getRuleSortOrder(): Promise<RuleSortOrder> {
  return new Promise(resolve => {
    prefs.ready(() => resolve(prefs.get('rule-sort')));
  });
}

/**
 * 对同一分组内的规则排序，返回新数组，不修改入参。
 * 仅在列表加载完成后调用一次，不随设置变化实时重排。
 *
 * id-asc 保持加载顺序：各规则表内已按 id 升序，且不同表的 id 会重复，
 * 直接按 id 排序会让不同表的规则交错。Array#sort 是稳定排序，
 * 比较结果相同时保持原有顺序。
 */
export function sortRules<T extends Pick<Rule, 'id' | 'name'>>(
  rules: T[],
  order: RuleSortOrder,
): T[] {
  switch (order) {
    case 'id-desc':
      return [...rules].sort((a, b) => b.id - a.id);
    case 'name-asc':
      return [...rules].sort(
        (a, b) => compareNames(a.name, b.name) || a.id - b.id,
      );
    case 'name-desc':
      return [...rules].sort(
        (a, b) => compareNames(b.name, a.name) || b.id - a.id,
      );
    default:
      // id-asc 以及未知值（旧数据等）：保持加载顺序
      return rules;
  }
}
