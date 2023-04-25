import { PrefValue } from './types';

export enum TABLE_NAMES {
  request = 'request',
  sendHeader = 'sendHeader',
  receiveHeader = 'receiveHeader',
  receiveBody = 'receiveBody',
}

export const TABLE_NAMES_ARR = Object.values(TABLE_NAMES);

export const VIRTUAL_KEY = '_v_key';

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
  HEALTH_CHECK = 'check',
  OPEN_URL = 'open_url',
  GET_RULES = 'get_rules',
  SAVE_RULE = 'save_rule',
  DELETE_RULE = 'del_rule',
  UPDATE_CACHE = 'update_cache',
  SET_PREFS = 'set_pref',
  ON_EVENT = 'event',
}

export enum IS_MATCH {
  MATCH,
  MATCH_BUT_EXCLUDE,
  NOT_MATCH,
}

export enum EVENTs {
  RULE_UPDATE = 'rule_update',
  RULE_DELETE = 'rule_delete',
}
