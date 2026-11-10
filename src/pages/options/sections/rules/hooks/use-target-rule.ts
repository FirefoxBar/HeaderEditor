import { type RefObject, useEffect, useRef } from 'react';
import { VIRTUAL_KEY } from '@/share/core/constant';
import type { Rule } from '@/share/core/types';
import type { GroupMap } from './use-rule-groups';

interface TargetRuleOptions {
  targetRule?: { table: string; id: number };
  loading: boolean;
  group: GroupMap;
  orderedNames: string[];
  listRef: RefObject<HTMLDivElement>;
  expandGroup: (name: string) => void;
  onEdit: (rule?: Rule) => void;
}

export default function useTargetRule({
  targetRule,
  loading,
  group,
  orderedNames,
  listRef,
  expandGroup,
  onEdit,
}: TargetRuleOptions) {
  const handledKeyRef = useRef<string>();

  useEffect(() => {
    if (!targetRule || loading) {
      return;
    }
    const targetKey = `${targetRule.table}-${targetRule.id}`;
    // 防止同一规则重复定位和重复打开编辑窗口
    if (handledKeyRef.current === targetKey) {
      return;
    }
    const targetGroup = Object.values(group).find(item =>
      item.rules.some(rule => rule[VIRTUAL_KEY] === targetKey),
    );
    const rule = targetGroup?.rules.find(
      item => item[VIRTUAL_KEY] === targetKey,
    );
    if (!targetGroup || !rule) {
      return;
    }
    handledKeyRef.current = targetKey;
    expandGroup(targetGroup.name);

    setTimeout(() => {
      const row = listRef.current?.querySelector(`.rule-item-${targetKey}`);
      console.log(row);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onEdit(rule);
    }, 10);
  }, [targetRule, loading, group, orderedNames, listRef, expandGroup, onEdit]);
}
