/**
 * 响应头条件匹配器
 * - values / excludedValues 为字符串数组，元素支持通配符 `*`（任意长度，含空）与 `?`（单个字符）
 * - 设计原则：通配符解析、正则合成、字面值分表等全部在 compileCondition 里做完，
 *   matchCondition 只做「建 slot 索引 + 调闭包」两件事
 * - matchCondition 返回 IS_MATCH：
 *   MATCH 表示命中、MATCH_BUT_EXCLUDE 表示命中但被排除、NOT_MATCH 表示未命中
 */

import { IS_MATCH } from './constant';
import type { HeaderMatchInfo } from './types';

export interface Condition {
  responseHeaders?: HeaderMatchInfo[];
  excludeResponseHeaders?: HeaderMatchInfo[];
}

export interface HeaderPair {
  name: string;
  value?: string;
}

type Slots = Array<string[] | undefined>; // slotId -> 该 header 的所有 value
type ValuesTest = (values: string[]) => boolean;
type RuleTest = (slots: Slots) => IS_MATCH;
type GroupTest = (slots: Slots) => IS_MATCH;

export interface CompiledCondition {
  headerIndex: Map<string, number>; // 小写 header 名 -> slotId
  matchesInclude: GroupTest; // 正向组：MATCH / EXCLUDE / NOT_MATCH
  matchesExclude: GroupTest; // 排除组：全部命中时为 MATCH（表示应触发排除）
}

/** 正则元字符（* ? \ 已在 glob 解析中单独处理） */
const REGEXP_SPECIAL = new Set([
  '.',
  '+',
  '^',
  '$',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '|',
]);

/**
 * 解析一个模式：
 * - src：含未转义通配符时为正则 source，否则为 null（走精确比较）
 * - text：解开转义后的字面文本（无通配符时即待比较的字面值）
 * 转义：`\*` `\?` `\\` 表示字面字符
 */
const globToSource = (
  pattern: string,
): { src: string | null; text: string } => {
  let src = '';
  let text = '';
  let hasWildcard = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      src += '.*';
      text += '*';
      hasWildcard = true;
      continue;
    }
    if (c === '?') {
      src += '.';
      text += '?';
      hasWildcard = true;
      continue;
    }
    if (c === '\\') {
      const next = pattern[i + 1];
      if (next === '*' || next === '?' || next === '\\') {
        src += '\\' + next;
        text += next;
        i++;
        continue;
      }
      src += '\\\\';
      text += '\\'; // 孤立反斜杠按字面处理
      continue;
    }
    src += REGEXP_SPECIAL.has(c) ? '\\' + c : c;
    text += c;
  }
  return { src: hasWildcard ? src : null, text };
};

interface CompiledValues {
  singleExact: string | null; // 单个字面值：=== 比较
  exactSet: Set<string> | null; // 多个字面值：Set 查找
  regex: RegExp | null; // 所有通配符模式合并成的一个正则
}

/** 编译 values / excludedValues；两侧都空返回 null */
const compileValues = (list?: string[]): CompiledValues | null => {
  const exact: string[] = [];
  const patterns: string[] = [];
  for (const item of list ?? []) {
    const { src, text } = globToSource(String(item));
    if (src === null)
      exact.push(text); // 纯字面（转义已解开）
    else patterns.push(src);
  }
  if (exact.length === 0 && patterns.length === 0) return null;

  return {
    singleExact: exact.length === 1 ? exact[0] : null,
    exactSet: exact.length > 1 ? new Set(exact) : null,
    // 多个模式合并为一个 alternation，运行期只需一次 test
    regex: patterns.length
      ? new RegExp(
          patterns.length === 1
            ? `^${patterns[0]}$`
            : `^(?:${patterns.join('|')})$`,
          's',
        )
      : null,
  };
};

/** 是否命中：字面值任一命中，或合并正则命中 */
const makeValuesTest = (m: CompiledValues): ValuesTest => {
  const { singleExact, exactSet, regex } = m;
  return (values: string[]): boolean => {
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (singleExact !== null) {
        if (v === singleExact) return true;
      } else if (exactSet !== null && exactSet.has(v)) {
        return true;
      }
      if (regex !== null && regex.test(v)) return true;
    }
    return false;
  };
};

/**
 * 把若干 RuleTest 合成一个组判定；空组返回常量闭包
 * 组内语义（与 isMatchUrl 一致：先看正向，再看排除）：
 * - 任一规则 NOT_MATCH → 整组 NOT_MATCH
 * - 否则任一规则 EXCLUDE → 整组 EXCLUDE
 * - 全部 MATCH → 整组 MATCH
 */
const compileGroup = (tests: RuleTest[], emptyResult: IS_MATCH): GroupTest => {
  if (tests.length === 0) return () => emptyResult;
  if (tests.length === 1) return tests[0];
  return slots => {
    for (let i = 0; i < tests.length; i++) {
      const r = tests[i](slots);
      if (r === IS_MATCH.NOT_MATCH || r === IS_MATCH.EXCLUDE) return r;
    }
    return IS_MATCH.MATCH;
  };
};

/** 规则只需编译一次，之后可反复用于多个请求 */
export const compileCondition = (c: Condition): CompiledCondition => {
  const headerIndex = new Map<string, number>();
  let nextSlot = 0;
  const getSlot = (name: string): number => {
    const k = name.toLowerCase(); // HTTP 头名不区分大小写
    let s = headerIndex.get(k);
    if (s === undefined) {
      s = nextSlot++;
      headerIndex.set(k, s);
    }
    return s;
  };

  const compileRule = (info: HeaderMatchInfo): RuleTest => {
    const slot = getSlot(info.header);
    const vt = compileValues(info.values); // null 表示为空
    const et = compileValues(info.excludedValues);

    // 四种形态各自生成专用闭包，运行期不再判断空标志
    if (vt && et) {
      // 两者都有：排除优先
      const hit = makeValuesTest(vt);
      const bad = makeValuesTest(et);
      return slots => {
        const v = slots[slot];
        if (v === undefined) return IS_MATCH.NOT_MATCH;
        if (bad(v)) return IS_MATCH.EXCLUDE;
        return hit(v) ? IS_MATCH.MATCH : IS_MATCH.NOT_MATCH;
      };
    }
    if (vt) {
      // 仅正向
      const hit = makeValuesTest(vt);
      return slots => {
        const v = slots[slot];
        return v !== undefined && hit(v) ? IS_MATCH.MATCH : IS_MATCH.NOT_MATCH;
      };
    }
    if (et) {
      // 仅排除：header 存在且未被排除才算命中
      const bad = makeValuesTest(et);
      return slots => {
        const v = slots[slot];
        if (v === undefined) return IS_MATCH.NOT_MATCH;
        return bad(v) ? IS_MATCH.EXCLUDE : IS_MATCH.MATCH;
      };
    }
    // 两侧都空：存在即匹配
    return slots =>
      slots[slot] !== undefined ? IS_MATCH.MATCH : IS_MATCH.NOT_MATCH;
  };

  const includeTests = (c.responseHeaders ?? []).map(compileRule);
  const excludeTests = (c.excludeResponseHeaders ?? []).map(compileRule);

  return {
    headerIndex,
    matchesInclude: compileGroup(includeTests, IS_MATCH.MATCH), // 空 include：无正向约束 → 通过
    matchesExclude: compileGroup(excludeTests, IS_MATCH.NOT_MATCH), // 空 exclude：没有排除规则命中 → 不触发排除
  };
};

/** 每个请求调用一次；headers 为响应头数组 */
export const matchCondition = (
  compiled: CompiledCondition,
  headers: HeaderPair[],
): IS_MATCH => {
  const slots: Slots = [];
  const idx = compiled.headerIndex;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    let slot = idx.get(h.name); // 先按原始大小写试，省掉 toLowerCase 分配
    if (slot === undefined) slot = idx.get(h.name.toLowerCase());
    if (slot === undefined) continue; // 规则不关心的头，直接丢弃
    const arr = slots[slot];
    if (arr === undefined) slots[slot] = [h.value ?? ''];
    else arr.push(h.value ?? '');
  }
  // 先看正向：任一 include 规则未命中 → NOT_MATCH
  const include = compiled.matchesInclude(slots);
  if (include === IS_MATCH.NOT_MATCH) return IS_MATCH.NOT_MATCH;
  // 再看排除：exclude 组全部命中 → 整条规则命中但被排除
  if (compiled.matchesExclude(slots) === IS_MATCH.MATCH) {
    return IS_MATCH.EXCLUDE;
  }
  // include 为 MATCH 或 MATCH_BUT_EXCLUDE（某条规则的 excludedValues 命中）
  return include;
};
