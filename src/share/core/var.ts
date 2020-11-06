export const TABLE_NAMES: TABLE_NAMES_TYPE[] = ['request', 'sendHeader', 'receiveHeader', 'receiveBody'];
export type TABLE_NAMES_TYPE = 'request' | 'sendHeader' | 'receiveHeader' | 'receiveBody';
export function isTableName(obj: any): obj is TABLE_NAMES_TYPE {
  return obj && TABLE_NAMES.includes(obj);
}
export type RULE_TYPE = 'cancel' | 'redirect' | 'modifySendHeader' | 'modifyReceiveHeader' | 'modifyReceiveBody';

type RuleAction =
  | 'cancel'
  | {
      name: string;
      value: string;
    };

export interface TinyRule {
  [key: string]: any;
  enable: boolean;
  name: string;
  ruleType: RULE_TYPE;
  matchType: 'all' | 'regexp' | 'prefix' | 'domain' | 'url';
  pattern: string;
  isFunction: boolean;
  code: string;
  exclude: string;
  group: string;
  encoding?: string;
  to?: string;
  action: RuleAction;
}

export function isTinyRule(obj: any): obj is TinyRule {
  return !obj.id && !!obj.ruleType;
}

export interface Rule extends TinyRule {
  id: number;
}

export interface ImportRule extends Rule {
  importAction: number;
  importOldId: number;
}

export interface InitedRule extends Rule {
  _reg: RegExp;
  _exclude?: RegExp;
  _func: (val: any, detail: any) => any;
}

export interface PrefValue {
  [key: string]: any;
  'disable-all': boolean;
  'add-hot-link': boolean;
  'manage-collapse-group': boolean; // Collapse groups
  'exclude-he': boolean; // rules take no effect on HE or not
  'show-common-header': boolean;
  'include-headers': boolean; // Include headers in custom function
  'modify-body': boolean; // Enable modify received body feature
  'is-debug': boolean;
}

export const defaultPrefValue: PrefValue = {
  'disable-all': false,
  'add-hot-link': true,
  'manage-collapse-group': true,
  'exclude-he': true,
  'show-common-header': true,
  'include-headers': false,
  'modify-body': false,
  'is-debug': false,
};

export enum APIs {
  HEALTH_CHECK,
  OPEN_URL,
  GET_RULES,
  SAVE_RULE,
  DELETE_RULE,
  UPDATE_CACHE,
}

export enum IS_MATCH {
  MATCH,
  MATCH_BUT_EXCLUDE,
  NOT_MATCH,
}
