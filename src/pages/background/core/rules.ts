import { cloneDeep } from 'lodash-es';
import { convertToRule, convertToBasicRule, isMatchUrl, upgradeRuleFormat, initRule } from '@/share/core/rule-utils';
import { getLocal } from '@/share/core/storage';
import { getTableName, getVirtualKey, isValidArray } from '@/share/core/utils';
import { APIs, EVENTs, IS_MATCH, RULE_TYPE, TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import type { InitdRule, RULE_ACTION_OBJ, Rule, RuleFilterOptions } from '@/share/core/types';
import notify from '@/share/core/notify';
import { prefs } from '@/share/core/prefs';
import emitter from '@/share/core/emitter';
import { getDatabase } from './db';

let loaded = false;

const cache: { [key: string]: null | InitdRule[] } = {};
TABLE_NAMES_ARR.forEach((t) => {
  cache[t] = null;
});

const updateCacheQueue: { [x: string]: Array<{ resolve: () => void; reject: (error: any) => void }> } = {};

async function updateCache(type: TABLE_NAMES): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果正在Update，则放到回调组里面
    if (typeof updateCacheQueue[type] !== 'undefined') {
      updateCacheQueue[type].push({ resolve, reject });
      return;
    } else {
      updateCacheQueue[type] = [{ resolve, reject }];
    }
    getDatabase()
      .then((db) => {
        const tx = db.transaction([type], 'readonly');
        const os = tx.objectStore(type);
        const all: InitdRule[] = [];
        os.openCursor().onsuccess = (event) => {
          // @ts-ignore
          const cursor = event.target.result;
          if (cursor) {
            const s: InitdRule = cursor.value;
            s.id = cursor.key;
            // Init function here
            try {
              all.push(initRule(s));
            } catch (e) {
              console.error('Cannot init rule', s, e);
            }
            cursor.continue();
          } else {
            cache[type] = all;
            updateCacheQueue[type].forEach((it) => {
              it.resolve();
            });
            delete updateCacheQueue[type];
          }
        };
      })
      .catch((e) => {
        updateCacheQueue[type].forEach((it) => {
          it.reject(e);
        });
        delete updateCacheQueue[type];
      });
  });
}

function filter(fromRules: InitdRule[], options?: RuleFilterOptions) {
  const rules = Array.from(fromRules);

  if (!options || typeof options !== 'object') {
    return rules;
  }

  const url = typeof options.url !== 'undefined' ? options.url : null;

  return rules.filter((rule) => {
    if (typeof options.runner !== 'undefined' && rule._runner !== options.runner) {
      return false;
    }

    if (typeof options.id !== 'undefined') {
      if (Array.isArray(options.id)) {
        if (!options.id.includes(rule.id)) {
          return false;
        }
      } else if (rule.id !== Number(options.id)) {
        return false;
      }
    }

    if (typeof options.id !== 'undefined') {
      if (Array.isArray(options.id)) {
        if (!options.id.includes(rule.id)) {
          return false;
        }
      } else if (rule.id !== Number(options.id)) {
        return false;
      }
    }

    if (options.name && rule.name !== options.name) {
      return false;
    }

    if (typeof options.enable !== 'undefined' && rule.enable !== options.enable) {
      return false;
    }

    if (typeof options.type !== 'undefined' && rule.ruleType !== options.type) {
      return false;
    }

    if (url !== null && isMatchUrl(rule, url) !== IS_MATCH.MATCH) {
      return false;
    }

    if (options.resourceType && rule.condition) {
      const { resourceTypes, excludeResourceTypes } = rule.condition;
      if (isValidArray(resourceTypes) && !resourceTypes.includes(options.resourceType)) {
        return false;
      }
      if (excludeResourceTypes && excludeResourceTypes.includes(options.resourceType)) {
        return false;
      }
    }

    return true;
  });
}

function saveRuleHistory(rule: Rule) {
  if (
    prefs.get('rule-history') &&
    !rule.isFunction &&
    [RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER, RULE_TYPE.REDIRECT].includes(rule.ruleType)
  ) {
    let writeValue: any;
    if (rule.ruleType === RULE_TYPE.REDIRECT) {
      writeValue = rule.to || '';
    }
    if ([RULE_TYPE.MODIFY_RECV_HEADER, RULE_TYPE.MODIFY_SEND_HEADER].includes(rule.ruleType)) {
      if (rule.headers) {
        writeValue = rule.headers;
      } else {
        writeValue = (rule.action as RULE_ACTION_OBJ).value;
      }
    }
    if (!writeValue) {
      return;
    }
    const key = `rule_switch_${getVirtualKey(rule)}`;
    const engine = getLocal();
    engine.get(key).then((result) => {
      const arr = Array.isArray(result[key]) ? [...result[key]] : [];
      if (!arr.includes(writeValue)) {
        arr.push(writeValue);
        engine.set({ [key]: arr });
      }
    });
  }
}

async function save(o: Rule): Promise<Rule> {
  const tableName = getTableName(o.ruleType);
  if (!tableName) {
    throw new Error(`Unknown type ${o.ruleType}`);
  }
  const rule = convertToRule(o);
  return new Promise((resolve) => {
    getDatabase().then((db) => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      // Check base information
      upgradeRuleFormat(rule);
      // Update
      if (rule.id && rule.id !== -1) {
        const request = os.get(Number(rule.id));
        request.onsuccess = () => {
          const existsRule = request.result || {};
          const originalRule = cloneDeep(existsRule);
          for (const prop in rule) {
            if (prop === 'id') {
              continue;
            }
            existsRule[prop] = rule[prop];
          }
          const req = os.put(existsRule);
          req.onsuccess = () => {
            updateCache(tableName);
            notify.other({ method: APIs.ON_EVENT, event: EVENTs.RULE_UPDATE, from: originalRule, target: existsRule });
            // Write history
            saveRuleHistory(originalRule);
            emitter.emit(emitter.INNER_RULE_UPDATE, { from: originalRule, target: existsRule });
            resolve(rule);
          };
        };
      } else {
        // Create
        // Make sure it's not null - that makes indexeddb sad
        // @ts-ignore
        delete rule.id;
        const request = os.add(rule);
        request.onsuccess = (event) => {
          updateCache(tableName);
          // Give it the ID that was generated
          // @ts-ignore
          rule.id = event.target.result;
          notify.other({ method: APIs.ON_EVENT, event: EVENTs.RULE_UPDATE, from: null, target: rule });
          emitter.emit(emitter.INNER_RULE_UPDATE, { from: null, target: rule });
          resolve(rule);
        };
      }
    });
  });
}

function remove(tableName: TABLE_NAMES, id: number): Promise<void> {
  return new Promise((resolve) => {
    getDatabase().then((db) => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      const request = os.delete(Number(id));
      request.onsuccess = () => {
        updateCache(tableName);
        notify.other({ method: APIs.ON_EVENT, event: EVENTs.RULE_DELETE, table: tableName, id: Number(id) });
        emitter.emit(emitter.INNER_RULE_REMOVE, { table: tableName, id: Number(id) });
        getLocal().remove(`rule_switch_${tableName}-${id}`);
        // check common mark
        getLocal()
          .get('common_rule')
          .then((result) => {
            const key = `${tableName}-${id}`;
            if (Array.isArray(result.common_rule) && result.common_rule.includes(key)) {
              const newKeys = [...result.common_rule];
              newKeys.splice(newKeys.indexOf(key), 1);
              getLocal().set({
                common_rule: newKeys,
              });
            }
          });
        resolve();
      };
    });
  });
}

function get(type: TABLE_NAMES, options?: RuleFilterOptions) {
  // When browser is starting up, pass all requests
  const all = cache[type];
  if (!all) {
    return null;
  }
  return options ? filter(all, options) : all;
}

function getAll() {
  return cache;
}

function init() {
  setTimeout(() => {
    const queue: Array<Promise<void>> = TABLE_NAMES_ARR.map((tableName) => updateCache(tableName));
    Promise.all(queue).then(() => {
      if (TABLE_NAMES_ARR.some((tableName) => cache[tableName] === null)) {
        init();
      } else {
        loaded = true;
        emitter.emit(emitter.INNER_RULE_LOADED);
      }
    });
  });
}

function waitLoad() {
  return new Promise((resolve) => {
    if (loaded) {
      resolve(true);
    } else {
      emitter.once(emitter.INNER_RULE_LOADED, resolve);
    }
  });
}

init();

export {
  get,
  getAll,
  filter,
  save,
  remove,
  updateCache,
  convertToBasicRule,
  waitLoad,
  loaded,
};
