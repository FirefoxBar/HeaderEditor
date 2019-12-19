import { getDatabase } from './storage';
import { getDomain, TABLE_NAMES, TABLE_NAMES_TYPE, upgradeRuleFormat } from './utils';
import { InitedRule, Rule } from './var';

const cache: { [key: string]: null | InitedRule[] } = {};
TABLE_NAMES.forEach(t => (cache[t] = null));

function updateCache(type: string) {
  return new Promise((resolve, reject) => {
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
            resolve();
          }
        };
      })
      .catch(reject);
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

function save(tableName: TABLE_NAMES_TYPE, o: Rule) {
  delete o._func;
  delete o._reg;
  return new Promise(resolve => {
    getDatabase().then(db => {
      const tx = db.transaction([tableName], 'readwrite');
      const os = tx.objectStore(tableName);
      // Check base informations
      upgradeRuleFormat(o);
      // Update
      if (o.id) {
        const request = os.get(Number(o.id));
        request.onsuccess = () => {
          const rule = request.result || {};
          for (const prop in o) {
            if (prop === 'id') {
              continue;
            }
            rule[prop] = o[prop];
          }
          const req = os.put(rule);
          req.onsuccess = () => {
            updateCache(tableName);
            resolve(rule);
          };
        };
      } else {
        // Create
        // Make sure it's not null - that makes indexeddb sad
        delete o.id;
        const request = os.add(o);
        request.onsuccess = event => {
          updateCache(tableName);
          // Give it the ID that was generated
          // @ts-ignore
          o.id = event.target.result;
          resolve(o);
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

function createExport(arr: { [key: string]: InitedRule[] }) {
  const result: { [key: string]: Rule[] } = {};
  // tslint:disable-next-line
  for (const k in arr) {
    result[k] = [];
    arr[k].forEach(e => {
      const copy = { ...e };
      delete copy.id;
      delete copy._reg;
      delete copy._func;
      delete copy._v_key;
      result[k].push(copy);
    });
  }
  return result;
}

function fromJson(str: string) {
  const list: { [key: string]: Rule[] } = JSON.parse(str);
  TABLE_NAMES.forEach(e => {
    if (list[e]) {
      list[e].map(ee => {
        delete ee.id;
        return upgradeRuleFormat(ee);
      });
    }
  });
  return list;
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
  }, 100);
}
init();

export default {
  get,
  filter,
  save,
  remove,
  updateCache,
  createExport,
  fromJson,
};
