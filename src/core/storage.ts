import equal from 'fast-deep-equal';
import { browser } from 'webextension-polyfill-ts';
import { TABLE_NAMES, upgradeRuleFormat } from './utils';

export function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbOpenRequest = window.indexedDB.open("headereditor", 4);
    dbOpenRequest.onsuccess = function(e) {
      // @ts-ignore
      resolve(e.target.result);
    };
    dbOpenRequest.onerror = function(event) {
      console.log(event);
      reject(event);
    };
    dbOpenRequest.onupgradeneeded = function(event) {
      if (event.oldVersion == 0) {
        // Installed
        TABLE_NAMES.forEach(t => {
          // @ts-ignore
          event.target.result.createObjectStore(t, {keyPath: 'id', autoIncrement: true});
        });
      } else {
        TABLE_NAMES.forEach(k => {
          // @ts-ignore
          const tx = event.target.transaction;
          if(!tx.objectStoreNames.contains(k)){
            // @ts-ignore
            event.target.result.createObjectStore(k, {keyPath: 'id', autoIncrement: true});
            return;
          }
          const os = tx.objectStore(k);
          os.openCursor().onsuccess = (e: any) => {
            const cursor = e.target.result;
            if (cursor) {
              const s = cursor.value;
              s.id = cursor.key;
              // upgrade rule format
              os.put(upgradeRuleFormat(s));
              cursor.continue();
            }
          };
        })
      }
    }
  });
};

interface PrefValue {
  [key: string]: any;
  "disable-all": boolean;
  "add-hot-link": boolean;
  "manage-collapse-group": boolean; // Collapse groups
  "exclude-he": boolean; // rules take no effect on HE or not
  "show-common-header": boolean;
  "include-headers": boolean; // Include headers in custom function
  "modify-body": boolean; // Enable modify received body feature
}
const defaultPrefValue: PrefValue = {
  "disable-all": false,
  "add-hot-link": true,
  "manage-collapse-group": true,
  "exclude-he": true,
  "show-common-header": true,
  "include-headers": false,
  "modify-body": false
};
class Prefs {
  private boundMethods: { [key: string]: (value: any) => any } = {};
  private boundWrappers: { [key: string]: any } = {};
  private watchQueue: { [key: string]: ((value: any, key: string) => void)[] } = {};
  // when browser is strarting up, the setting is default
  private isDefault = true;
  private waitQueue: ((value: any) => any)[] = [];
  private values: PrefValue;

  constructor() {
    this.waitQueue = [];
    this.values = Object.assign({}, defaultPrefValue);

    Object.entries(defaultPrefValue).forEach(it => {
      this.set(it[0], it[1], true);
    });
  
    getSync().get("settings").then(result => {
      const synced = result.settings;
      for (const key in defaultPrefValue) {
        if (synced && (key in synced)) {
          this.set(key, synced[key], true);
        } else {
          const value = tryMigrating(key);
          if (value !== undefined) {
            this.set(key, value);
          }
        }
      }
      this.isDefault = false;
      this.waitQueue.forEach(resolve => resolve(this));
    });
  
    browser.storage.onChanged.addListener((changes, area) => {
      if (area == "sync" && "settings" in changes) {
        const synced = changes.settings.newValue;
        if (synced) {
          for (const key in defaultPrefValue) {
            if (key in synced) {
              this.set(key, synced[key], true);
              if (this.watchQueue[key]) {
                this.watchQueue[key].forEach(cb => cb(synced[key], key));
              }
            }
          }
        } else {
          // user manually deleted our settings, we'll recreate them
          getSync().set({"settings": this.values});
        }
      }
    });
  
    function tryMigrating(key: string) {
      if (!(key in localStorage)) {
        return undefined;
      }
      const value = localStorage[key];
      delete localStorage[key];
      localStorage["DEPRECATED: " + key] = value;
      switch (typeof defaultPrefValue[key]) {
        case "boolean":
          return value.toLowerCase() === "true";
        case "number":
          return Number(value);
        case "object":
          try {
            return JSON.parse(value);
          } catch(e) {
            console.log("Cannot migrate from localStorage %s = '%s': %o", key, value, e);
            return undefined;
          }
      }
      return value;
    }
  }
  get(key: string, defaultValue: any) {
    if (key in this.boundMethods) {
      if (key in this.boundWrappers) {
        return this.boundWrappers[key];
      } else {
        if (key in this.values) {
          this.boundWrappers[key] = this.boundMethods[key](this.values[key]);
          return this.boundWrappers[key];
        }
      }
    }
    if (key in this.values) {
      return this.values[key];
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (key in defaultPrefValue) {
      return defaultPrefValue[key];
    }
    console.warn('No default preference for ' + key);
  }
  getAll() {
    return Object.assign({}, this.values);
  }
  set(key: string, value: any, noSync: boolean = false) {
    const oldValue = this.values[key];
    if (!equal(value, oldValue)) {
      this.values[key] = value;
      if (!noSync) {
        getSync().set({"settings": this.values});
      }
    }
  }
  bindAPI(apiName: string, apiMethod: (value: any) => any) {
    this.boundMethods[apiName] = apiMethod;
  }
  remove(key: string) {
    this.set(key, undefined)
  }
  watch(key: string, callback: (value: any, key: string) => void) {
    if (typeof(this.watchQueue[key]) === "undefined") {
      this.watchQueue[key] = [];
    }
    this.watchQueue[key].push(callback);
  }
  onReady() {
    const _this = this;
    return new Promise(resolve => {
      if (!_this.isDefault) {
        resolve(_this);
      } else {
        _this.waitQueue.push(resolve);
      }
    });
  }
}

// @ts-ignore
export const prefs = browser.extension.getBackgroundPage().prefs || new Prefs();

export function getSync() {
  // For development mode
  if (typeof(process) !== "undefined" && process.env.NODE_ENV === "development") {
    return browser.storage.local;
  }
  try {
    if ("sync" in browser.storage) {
      return browser.storage.sync;
    }
  } catch (e) {
  }
  return browser.storage.local;
}

export function getLocal() {
  return browser.storage.local;
}
