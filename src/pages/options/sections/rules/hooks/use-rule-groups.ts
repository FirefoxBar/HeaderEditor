import { useCallback, useEffect, useReducer, useRef } from 'react';
import { t } from '@/share/core/browser';
import {
  EVENTs,
  type TABLE_NAMES,
  TABLE_NAMES_ARR,
  VIRTUAL_KEY,
} from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import logger from '@/share/core/logger';
import notify from '@/share/core/notify';
import type { Rule, RuleWithVirtualKey } from '@/share/core/types';
import { getVirtualKey } from '@/share/core/utils';
import Api from '@/share/pages/api';

export interface GroupItem {
  name: string;
  rules: RuleWithVirtualKey[];
}

export type GroupMap = { [key: string]: GroupItem };

interface GroupsState {
  loading: boolean;
  group: GroupMap;
}

type GroupsAction =
  | { type: 'load-start' }
  | { type: 'loaded'; group: GroupMap }
  | { type: 'upsert'; rule: Rule }
  | { type: 'remove'; virtualKey: string };

function withoutEmptyGroups(group: GroupMap): GroupMap {
  const ungrouped = t('ungrouped');
  const result: GroupMap = {};
  for (const [key, item] of Object.entries(group)) {
    if (item.rules.length > 0 || key === ungrouped) {
      result[key] = item;
    }
  }
  return result;
}

function reducer(state: GroupsState, action: GroupsAction): GroupsState {
  switch (action.type) {
    case 'load-start':
      return { loading: true, group: {} };
    case 'loaded':
      return { loading: false, group: action.group };
    case 'upsert': {
      const { rule } = action;
      const virtualKey = getVirtualKey(rule);
      const displayRule: RuleWithVirtualKey = {
        ...rule,
        [VIRTUAL_KEY]: virtualKey,
      };
      const group: GroupMap = {};
      for (const [key, item] of Object.entries(state.group)) {
        const rules = item.rules.filter(it => it[VIRTUAL_KEY] !== virtualKey);
        group[key] =
          rules.length === item.rules.length ? item : { ...item, rules };
      }
      const target = group[rule.group] ?? { name: rule.group, rules: [] };
      group[rule.group] = { ...target, rules: [...target.rules, displayRule] };
      return { ...state, group: withoutEmptyGroups(group) };
    }
    case 'remove': {
      const group: GroupMap = {};
      for (const [key, item] of Object.entries(state.group)) {
        const rules = item.rules.filter(
          it => it[VIRTUAL_KEY] !== action.virtualKey,
        );
        group[key] =
          rules.length === item.rules.length ? item : { ...item, rules };
      }
      return { ...state, group: withoutEmptyGroups(group) };
    }
  }
}

export default function useRuleGroups() {
  const [state, dispatch] = useReducer(reducer, { loading: false, group: {} });
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const groupNamesRef = useRef<string[]>([]);

  const load = useCallback(() => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    dispatch({ type: 'load-start' });
    const result: GroupMap = {
      [t('ungrouped')]: { name: t('ungrouped'), rules: [] },
    };
    const requestRules = (table: TABLE_NAMES): Promise<void> =>
      Api.getRules(table).then(response => {
        if (!response) {
          // Browser is starting up
          return new Promise<void>(resolve => {
            setTimeout(() => resolve(requestRules(table)), 0);
          });
        }
        response.forEach(item => {
          if (!result[item.group]) {
            result[item.group] = { name: item.group, rules: [] };
          }
          (item as RuleWithVirtualKey)[VIRTUAL_KEY] = getVirtualKey(item);
          result[item.group].rules.push(item as RuleWithVirtualKey);
        });
      });
    Promise.all(TABLE_NAMES_ARR.map(requestRules)).then(() => {
      loadingRef.current = false;
      if (mountedRef.current) {
        dispatch({ type: 'loaded', group: result });
      }
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const handleUpdate = (request: { target: Rule }) => {
      logger.debug('[options/rules] rules update', () => [request]);
      dispatch({ type: 'upsert', rule: request.target });
    };
    const handleDelete = (request: { id: number; table: string }) => {
      dispatch({
        type: 'remove',
        virtualKey: `${request.table}-${request.id}`,
      });
    };
    notify.event.on(EVENTs.RULE_UPDATE, handleUpdate);
    notify.event.on(EVENTs.RULE_DELETE, handleDelete);
    return () => {
      mountedRef.current = false;
      notify.event.off(EVENTs.RULE_UPDATE, handleUpdate);
      notify.event.off(EVENTs.RULE_DELETE, handleDelete);
    };
  }, [load]);

  const groupNames = Object.keys(state.group);
  useEffect(() => {
    if (state.loading) {
      return;
    }
    const prev = groupNamesRef.current;
    if (
      prev.length !== groupNames.length ||
      prev.some((name, i) => name !== groupNames[i])
    ) {
      groupNamesRef.current = groupNames;
      emitter.emit(emitter.EVENT_GROUP_UPDATE, groupNames);
    }
  }, [state.loading, groupNames]);

  return { ...state, load };
}
