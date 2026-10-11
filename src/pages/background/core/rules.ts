import isEqual from 'fast-deep-equal';
import { cloneDeep } from 'lodash-es';
import { t } from '@/share/core/browser';
import {
  APIs,
  EVENTs,
  type TABLE_NAMES,
  TABLE_NAMES_ARR,
} from '@/share/core/constant';
import emitter from '@/share/core/emitter';
import notify from '@/share/core/notify';
import { prefs } from '@/share/core/prefs';
import {
  convertToBasicRule,
  convertToRule,
  filter,
  initRule,
  upgradeRuleFormat,
} from '@/share/core/rule-utils';
import SessionMessage from '@/share/core/session-message';
import { getLocal } from '@/share/core/storage';
import type {
  InitdRule,
  RULE_ACTION_OBJ,
  Rule,
  RuleFilterOptions,
} from '@/share/core/types';
import {
  getTableName,
  getVirtualKey,
  isModifyHeaderRule,
  isRedirectRule,
  sleep,
} from '@/share/core/utils';
import { getDatabase } from './db';

let loaded = false;

const cache: { [key: string]: null | InitdRule[] } = {};
TABLE_NAMES_ARR.forEach(t => {
  cache[t] = null;
});

const updateCacheQueue: Record<string, Promise<void>> = {};

function updateCache(type: TABLE_NAMES): Promise<void> {
  if (typeof updateCacheQueue[type] !== 'undefined') {
    return updateCacheQueue[type];
  }

  const p = new Promise<void>((resolve, reject) => {
    getDatabase()
      .then(db => {
        const tx = db.transaction([type], 'readonly');
        const os = tx.objectStore(type);
        const all: InitdRule[] = [];
        os.openCursor().onsuccess = event => {
          // @ts-ignore
          const cursor = event.target.result;
          if (cursor) {
            const s: InitdRule = cursor.value;
            s.id = cursor.key;
            // Init function here
            try {
              all.push(initRule(s));
            } catch (e) {
              console.error('Init rule failed', s, e);
              SessionMessage.add({
                type: 'warning',
                title: t('init_rule_failed'),
                content: `Rule: [${s.id}] ${s.name}\nError: ${(e as Error).message}`,
                more: `Rule: ${JSON.stringify(s)}`,
              });
            }
            cursor.continue();
          } else {
            cache[type] = all;
            resolve();
          }
        };
      })
      .catch(e => {
        reject(e);
      })
      .finally(() => {
        delete updateCacheQueue[type];
      });
  });

  updateCacheQueue[type] = p;

  return p;
}

function updateSingleCache(type: TABLE_NAMES, id: number): Promise<void> {
  if (typeof updateCacheQueue[type] !== 'undefined') {
    return updateCacheQueue[type];
  }

  const p = new Promise<void>((resolve, reject) => {
    getDatabase()
      .then(db => {
        const tx = db.transaction([type], 'readonly');
        const os = tx.objectStore(type);
        const req = os.get(id);
        if (cache[type]) {
          const index = cache[type].findIndex(rule => rule.id === id);
          if (index !== -1) {
            cache[type].splice(index, 1);
          }
        }
        req.onsuccess = () => {
          const s: InitdRule = req.result;
          // Init function here
          try {
            cache[type]?.push(initRule(s));
          } catch (e) {
            console.error('Init rule failed', s, e);
            SessionMessage.add({
              type: 'warning',
              title: t('init_rule_failed'),
              content: `Rule: [${s.id}] ${s.name}\nError: ${(e as Error).message}`,
              more: `Rule: ${JSON.stringify(s)}`,
            });
          }
          resolve();
        };
        req.onerror = () => {
          // Rule not found, ignore
        };
      })
      .catch(e => {
        reject(e);
      });
  });

  return p;
}

function saveRuleHistory(rule: Rule) {
  if (
    prefs.get('rule-history') &&
    !rule.isFunction &&
    (isRedirectRule(rule.ruleType) || isModifyHeaderRule(rule.ruleType))
  ) {
    let writeValue: any;
    if (isRedirectRule(rule.ruleType)) {
      writeValue = rule.to || '';
    }
    if (isModifyHeaderRule(rule.ruleType)) {
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
    engine.get(key).then(result => {
      const arr = Array.isArray(result[key]) ? [...result[key]] : [];
      const exists =
        typeof writeValue === 'string'
          ? arr.includes(writeValue)
          : arr.some(it => isEqual(it, writeValue));
      if (!exists) {
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
  return new Promise(resolve => {
    getDatabase().then(db => {
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
            existsRule[prop] = rule[prop as keyof Rule];
          }
          const req = os.put(existsRule);
          req.onsuccess = () => {
            updateSingleCache(tableName, rule.id).then(() => {
              notify.other({
                method: APIs.ON_EVENT,
                event: EVENTs.RULE_UPDATE,
                from: originalRule,
                target: existsRule,
              });
              // Write history
              saveRuleHistory(originalRule);
              emitter.emit(emitter.INNER_RULE_UPDATE, {
                from: originalRule,
                target: existsRule,
              });
              resolve(rule);
            });
          };
        };
      } else {
        // Create
        // Make sure it's not null - that makes indexeddb sad
        // @ts-ignore
        delete rule.id;
        const request = os.add(rule);
        request.onsuccess = event => {
          // Give it the ID that was generated
          rule.id = (event.target as any).result;
          updateCache(tableName).then(() => {
            notify.other({
              method: APIs.ON_EVENT,
              event: EVENTs.RULE_UPDATE,
              from: null,
              target: rule,
            });
            emitter.emit(emitter.INNER_RULE_UPDATE, {
              from: null,
              target: rule,
            });
            resolve(rule);
          });
        };
      }
    });
  });
}

function remove(tableName: TABLE_NAMES, id: number): Promise<void> {
  return new Promise(resolve => {
    getDatabase().then(db => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      const request = os.delete(Number(id));
      request.onsuccess = () => {
        if (cache[tableName]) {
          const index = cache[tableName].findIndex(rule => rule.id === id);
          if (index !== -1) {
            cache[tableName].splice(index, 1);
          }
        }
        notify.other({
          method: APIs.ON_EVENT,
          event: EVENTs.RULE_DELETE,
          table: tableName,
          id: Number(id),
        });
        emitter.emit(emitter.INNER_RULE_REMOVE, {
          table: tableName,
          id: Number(id),
        });
        getLocal().remove(`rule_switch_${tableName}-${id}`);
        // check common mark
        getLocal()
          .get('common_rule')
          .then(result => {
            const key = `${tableName}-${id}`;
            if (
              Array.isArray(result.common_rule) &&
              result.common_rule.includes(key)
            ) {
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

async function init(isRetry = false) {
  if (isRetry) {
    await sleep(10);
  }
  const queue: Array<Promise<void>> = TABLE_NAMES_ARR.map(tableName =>
    updateCache(tableName),
  );
  try {
    await Promise.all(queue);
    if (TABLE_NAMES_ARR.some(tableName => cache[tableName] === null)) {
      init(true);
    } else {
      loaded = true;
      emitter.emit(emitter.INNER_RULE_LOADED);
    }
  } catch (e) {
    init(true);
  }
}

function waitLoad() {
  return new Promise(resolve => {
    if (loaded) {
      resolve(true);
    } else {
      emitter.once(emitter.INNER_RULE_LOADED, resolve);
    }
  });
}

export {
  convertToBasicRule,
  // 匹配逻辑已下沉至 share/core/rule-utils，此处仅 re-export 以兼容现有调用方
  filter,
  get,
  getAll,
  init,
  loaded,
  remove,
  save,
  updateCache,
  waitLoad,
};
