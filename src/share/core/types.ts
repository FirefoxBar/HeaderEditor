import type { RULE_MATCH_TYPE, RULE_TYPE } from './constant';

export interface RuleFilterOptions {
  enable?: boolean;
  url?: string;
  id?: number | number[];
  name?: string;
}

export type RULE_ACTION =
  | 'cancel'
  | {
    name: string;
    value: string;
  };

export interface BasicRule {
  [key: string]: any;
  enable: boolean;
  name: string;
  ruleType: RULE_TYPE;
  matchType: RULE_MATCH_TYPE;
  pattern: string;
  isFunction: boolean;
  code: string;
  exclude: string;
  group: string;
  encoding?: string;
  to?: string;
  action: RULE_ACTION;
}

export function isBasicRule(obj: any): obj is BasicRule {
  return !obj.id && !!obj.ruleType;
}

export interface Rule extends BasicRule {
  id: number;
}

export interface ImportRule extends Rule {
  importAction: number;
  importOldId: number;
}

export interface InitdRule extends Rule {
  _reg: RegExp;
  _exclude?: RegExp;
  _func: (val: any, detail: any) => any;
}

export interface PrefValue {
  [key: string]: any;
  'disable-all': boolean;
  'manage-collapse-group': boolean; // Collapse groups
  'exclude-he': boolean; // rules take no effect on HE or not
  'show-common-header': boolean;
  'include-headers': boolean; // Include headers in custom function
  'modify-body': boolean; // Enable modify received body feature
  'is-debug': boolean;
  'dark-mode': 'auto' | 'on' | 'off';
}
