import { convertToRule, convertToTinyRule, upgradeRuleFormat } from './ruleUtils';
import { getDatabase } from './storage';
import { getDomain, getTableName } from './utils';
import { InitedRule, Rule, TABLE_NAMES, TABLE_NAMES_TYPE } from './var';

const cache: { [key: string]: null | InitedRule[] } = {};
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
        const all: InitedRule[] = [];
        os.openCursor().onsuccess = event => {
          // @ts-ignore
          const cursor = event.target.result;
          if (cursor) {
            const s: InitedRule = cursor.value;
            let isValidRule = true;
            s.id = cursor.key;
            // Init function here
            if (s.isFunction) {
              try {
                // @ts-ignore
                // tslint:disable-next-line
                s._func = new Function('val', 'detail', s.code);
              } catch (e) {
                isValidRule = false;
              }
            }
            // Init regexp
            if (s.matchType === 'regexp') {
              try {
                s._reg = new RegExp(s.pattern, 'g');
              } catch (e) {
                isValidRule = false;
              }
            }
            if (typeof s.exclude === 'string' && s.exclude.length > 0) {
              try {
                s._exclude = new RegExp(s.exclude);
              } catch (e) {
                isValidRule = false;
              }
            }
            if (isValidRule) {
              all.push(s);
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
function filter(fromRules: InitedRule[], options: FilterOptions) {
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
    rules = rules.filter(rule => {
      let result = false;
      switch (rule.matchType) {
        case 'all':
          result = true;
          break;
        case 'regexp':
          rule._reg.lastIndex = 0;
          result = rule._reg.test(url);
          break;
        case 'prefix':
          result = url.indexOf(rule.pattern) === 0;
          break;
        case 'domain':
          result = getDomain(url) === rule.pattern;
          break;
        case 'url':
          result = url === rule.pattern;
          break;
        default:
          break;
      }
      if (result && rule._exclude) {
        return !rule._exclude.test(url);
      } else {
        return result;
      }
    });
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
      if (rule.id) {
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
