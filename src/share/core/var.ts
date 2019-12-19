export interface TinyRule {
  [key: string]: any;
  enable: boolean;
  name: string;
  matchType: 'all' | 'regexp' | 'prefix' | 'domain' | 'url';
  pattern: string;
  isFunction: boolean;
  code: string;
  exclude: string;
  group: string;
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
}

export const defaultPrefValue: PrefValue = {
  'disable-all': false,
  'add-hot-link': true,
  'manage-collapse-group': true,
  'exclude-he': true,
  'show-common-header': true,
  'include-headers': false,
  'modify-body': false,
};
