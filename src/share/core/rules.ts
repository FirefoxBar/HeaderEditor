import { convertToRule, convertToTinyRule, isMatchUrl, upgradeRuleFormat, initRule } from './ruleUtils';
import { getDatabase } from './storage';
import { getTableName } from './utils';
import { InitdRule, IS_MATCH, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from './var';

const cache: { [key: string]: null | InitdRule[] } = {};
TABLE_NAMES.forEach(t => (cache[t] = null));

const updateCacheQueue: { [x: string]: Array<{ resolve: () => void; reject: (error: any) => void }> } = {};
function updateCache(type: string) {
  return new Promise((resolve, reject) => {
    // 如果正在Update，则放到回调组里面
    if (typeof updateCacheQueue[type] !== 'undefined') {
      updateCacheQueue[type].push({ resolve, reject });
      return;
    } else {
      updateCacheQueue[type] = [{ resolve, reject }];
    }
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
            const isValidRule = true;
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
            updateCacheQueue[type].forEach(it => {
              it.resolve();
            });
            delete updateCacheQueue[type];
          }
        };
      })
      .catch(e => {
        updateCacheQueue[type].forEach(it => {
          it.reject(e);
        });
        delete updateCacheQueue[type];
      });
  });
}

interface FilterOptions {
  enable?: boolean;
  url?: string;
  id?: number;
  name?: string;
}
function filter(fromRules: InitdRule[], options: FilterOptions) {
  let rules = Array.from(fromRules);
  if (options === null || typeof options !== 'object') {
    return rules;
  }
  const url = typeof options.url !== 'undefined' ? options.url : null;
  const id = typeof options.id !== 'undefined' ? Number(options.id) : null;

  if (id !== null) {
    rules = rules.filter(rule => {
      return rule.id === id;
    });
  }

  if (options.name) {
    rules = rules.filter(rule => {
      return rule.name === options.name;
    });
  }

  if (typeof options.enable !== 'undefined') {
    rules = rules.filter(rule => {
      return rule.enable === options.enable;
    });
  }

  if (url != null) {
    rules = rules.filter(rule => isMatchUrl(rule, url) === IS_MATCH.MATCH);
  }
  return rules;
}

function save(o: Rule) {
  const tableName = getTableName(o.ruleType);
  if (!tableName) {
    return Promise.reject(`Unknown type ${o.ruleType}`);
  }
  const rule = convertToRule(o);
  return new Promise(resolve => {
    getDatabase().then(db => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      // Check base informations
      upgradeRuleFormat(rule);
      // Update
      if (rule.id && rule.id !== -1) {
        const request = os.get(Number(rule.id));
        request.onsuccess = () => {
          const existsRule = request.result || {};
          for (const prop in rule) {
            if (prop === 'id') {
              continue;
            }
            existsRule[prop] = rule[prop];
          }
          const req = os.put(existsRule);
          req.onsuccess = () => {
            updateCache(tableName);
            resolve(rule);
          };
        };
      } else {
        // Create
        // Make sure it's not null - that makes indexeddb sad
        delete rule.id;
        const request = os.add(rule);
        request.onsuccess = event => {
          updateCache(tableName);
          // Give it the ID that was generated
          // @ts-ignore
          rule.id = event.target.result;
          resolve(rule);
        };
      }
    });
  });
}

function remove(tableName: TABLE_NAMES_TYPE, id: number) {
  return new Promise(resolve => {
    getDatabase().then(db => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      const request = os.delete(Number(id));
      request.onsuccess = () => {
        updateCache(tableName);
        resolve();
      };
    });
  });
}

function get(type: TABLE_NAMES_TYPE, options?: FilterOptions) {
  // When browser is starting up, pass all requests
  const all = cache[type];
  if (!all) {
    return null;
  }
  return options ? filter(all, options) : all;
}

function init() {
  setTimeout(() => {
    const queue = [];
    if (cache.request === null) {
      queue.push(updateCache('request'));
    }
    if (cache.sendHeader === null) {
      queue.push(updateCache('sendHeader'));
    }
    if (cache.receiveHeader === null) {
      queue.push(updateCache('receiveHeader'));
    }
    if (cache.receiveBody === null) {
      queue.push(updateCache('receiveBody'));
    }
    Promise.all(queue).then(() => {
      if (
        cache.request === null ||
        cache.sendHeader === null ||
        cache.receiveHeader === null ||
        cache.receiveBody === null
      ) {
        init();
      }
    });
  });
}

init();

export default {
  get,
  filter,
  save,
  remove,
  updateCache,
  convertToTinyRule,
};
