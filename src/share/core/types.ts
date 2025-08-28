import type { DeclarativeNetRequest } from 'webextension-polyfill/namespaces/declarativeNetRequest';
import type { RULE_MATCH_TYPE, RULE_TYPE, VIRTUAL_KEY } from './constant';

export interface RuleFilterOptions {
  enable?: boolean;
  url?: string;
  id?: number | number[];
  name?: string;
  runner?: 'web_request' | 'dnr';
  type?: RULE_TYPE;
  method?: string; // request method, lowercase
  resourceType?: DeclarativeNetRequest.ResourceType;
}

/** @deprecated */
export interface RULE_ACTION_OBJ {
  name: string;
  value: string;
}

export type RULE_ACTION = 'cancel' | RULE_ACTION_OBJ;

export interface BasicRule {
  enable: boolean;
  name: string;
  ruleType: RULE_TYPE;
  /** @deprecated */
  matchType?: RULE_MATCH_TYPE;
  /** @deprecated */
  pattern?: string;
  /** @deprecated */
  exclude?: string;
  isFunction: boolean;
  code: string;
  group: string;
  encoding?: string;
  to?: string;
  /** @deprecated deprecated */
  action?: RULE_ACTION;
  condition?: Partial<{
    all: boolean;
    url: string;
    urlPrefix: string;
    method: string[];
    domain: string[];
    excludeDomain: string[];
    regex: string;
    excludeRegex: string;
    excludeMethod: string[];
    resourceTypes: DeclarativeNetRequest.ResourceType[];
    excludeResourceTypes: DeclarativeNetRequest.ResourceType[];
  }>;
  headers?: Record<string, string>;
  body?: {
    stage?: 'Request' | 'Response';
    type?: 'text' | 'file';
    fileName?: string;
    value: string;
  };
}

export function isBasicRule(obj: any): obj is BasicRule {
  return !obj.id && !!obj.ruleType;
}

export interface Rule extends BasicRule {
  id: number;
}

export interface RuleWithVirtualKey extends Rule {
  [VIRTUAL_KEY]: string;
}

export interface ImportRule extends Rule {
  importAction: number;
  importOldId: number;
}

export interface InitdRule extends Rule {
  _runner: 'web_request' | 'dnr';
  _reg: RegExp;
  _exclude?: RegExp;
  _func: (val: any, detail: any) => any;
}

export interface PrefValue {
  'disable-all': boolean;
  'manage-collapse-group': boolean; // Collapse groups
  'exclude-he': boolean; // rules take no effect on HE or not
  'show-common-header': boolean;
  'include-headers': boolean; // Include headers in custom function
  'modify-body': boolean; // Enable modify received body feature
  'is-debug': boolean;
  'dark-mode': 'auto' | 'on' | 'off';
  'rule-switch': boolean; // Enable rule quick switch
  'rule-history': boolean; // Auto save rule history into quick switch
  'quick-edit': boolean; // Quick edit rule in popup panel
  'popup-show-rules': 'all' | 'common'; // Which rules to show in popup panel
}
