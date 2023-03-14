export const TABLE_NAMES: TABLE_NAMES_TYPE[] = ['request', 'sendHeader', 'receiveHeader', 'receiveBody'];
export type TABLE_NAMES_TYPE = 'request' | 'sendHeader' | 'receiveHeader' | 'receiveBody';
export function isTableName(obj: any): obj is TABLE_NAMES_TYPE {
  return obj && TABLE_NAMES.includes(obj);
}

export enum RULE_TYPE {
  CANCEL = 'cancel',
  REDIRECT = 'redirect',
  MODIFY_SEND_HEADER = 'modifySendHeader',
  MODIFY_RECV_HEADER = 'modifyReceiveHeader',
  MODIFY_RECV_BODY = 'modifyReceiveBody',
}

export enum RULE_MATCH_TYPE {
  ALL = 'all',
  REGEXP = 'regexp',
  PREFIX = 'prefix',
  DOMAIN = 'domain',
  URL = 'url',
}

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
  matchType: RULE_MATCH_TYPE;
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

export const defaultPrefValue: PrefValue = {
  'disable-all': false,
  'manage-collapse-group': true,
  'exclude-he': true,
  'show-common-header': true,
  'include-headers': false,
  'modify-body': false,
  'is-debug': false,
  'dark-mode': 'auto',
};

export enum APIs {
  HEALTH_CHECK,
  OPEN_URL,
  GET_RULES,
  SAVE_RULE,
  DELETE_RULE,
  UPDATE_CACHE,
  SET_PREFS,
}

export enum IS_MATCH {
  MATCH,
  MATCH_BUT_EXCLUDE,
  NOT_MATCH,
}
