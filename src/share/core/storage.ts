import equal from 'fast-deep-equal';
import { browser } from 'webextension-polyfill-ts';
import emit from './emit';
import { upgradeRuleFormat } from './utils';
import { defaultPrefValue, PrefValue, TABLE_NAMES } from './var';

export function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbOpenRequest = window.indexedDB.open('headereditor', 4);
    dbOpenRequest.onsuccess = e => {
      // @ts-ignore
      resolve(e.target.result);
    };
    dbOpenRequest.onerror = e => {
      console.error(e);
      reject(e);
    };
    dbOpenRequest.onupgradeneeded = event => {
      if (event.oldVersion === 0) {
        // Installed
        TABLE_NAMES.forEach(t => {
          // @ts-ignore
          event.target.result.createObjectStore(t, { keyPath: 'id', autoIncrement: true });
        });
      } else {
        TABLE_NAMES.forEach(k => {
          // @ts-ignore
          const tx = event.target.transaction;
          if (!tx.objectStoreNames.contains(k)) {
            // @ts-ignore
            event.target.result.createObjectStore(k, { keyPath: 'id', autoIncrement: true });
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
        });
      }
    };
  });
}

class Prefs {
  private boundMethods: { [key: string]: (value: any) => any } = {};
  private boundWrappers: { [key: string]: any } = {};
  // when browser is strarting up, the setting is default
  private isDefault = true;
  private values: PrefValue;

  constructor() {
    this.values = { ...defaultPrefValue };

    Object.entries(defaultPrefValue).forEach(it => {
      this.set(it[0], it[1], true);
    });

    getSync()
      .get('settings')
      .then(result => {
        const synced = result.settings;
        for (const key in defaultPrefValue) {
          if (synced && key in synced) {
            this.set(key, synced[key], true);
          } else {
            const value = tryMigrating(key);
            if (value !== undefined) {
              this.set(key, value);
            }
          }
        }
        this.isDefault = false;
        emit.emit(emit.EVENT_PREFS_READY);
      });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && 'settings' in changes) {
        const synced = changes.settings.newValue;
        if (synced) {
          for (const key in defaultPrefValue) {
            if (key in synced) {
              this.set(key, synced[key], true);
            }
          }
        } else {
          // user manually deleted our settings, we'll recreate them
          getSync().set({ settings: this.values });
        }
      }
    });

    function tryMigrating(key: string) {
      if (!(key in localStorage)) {
        return undefined;
      }
      const value = localStorage[key];
      delete localStorage[key];
      localStorage['DEPRECATED: ' + key] = value;
      switch (typeof defaultPrefValue[key]) {
        case 'boolean':
          return value.toLowerCase() === 'true';
        case 'number':
          return Number(value);
        case 'object':
          try {
            return JSON.parse(value);
          } catch (e) {
            console.error("Cannot migrate from localStorage %s = '%s': %o", key, value, e);
            return undefined;
          }
      }
      return value;
    }
  }
  get(key: string, defaultValue?: any) {
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
    return { ...this.values };
  }
  set(key: string, value: any, noSync: boolean = false) {
    const oldValue = this.values[key];
    if (!equal(value, oldValue)) {
      this.values[key] = value;
      emit.emit(emit.EVENT_PREFS_UPDATE, key, value);
      if (!noSync) {
        getSync().set({
          settings: this.values,
        });
      }
    }
  }
  bindAPI(apiName: string, apiMethod: (value: any) => any) {
    this.boundMethods[apiName] = apiMethod;
  }
  remove(key: string) {
    this.set(key, undefined);
  }
  ready(cb: () => void) {
    if (!this.isDefault) {
      cb();
    } else {
      emit.once(emit.EVENT_PREFS_READY, cb);
    }
  }
}

interface BackgroundWindow extends Window {
  prefs?: Prefs;
}
const backgroundWindow = browser.extension.getBackgroundPage() as BackgroundWindow;
export const prefs = backgroundWindow && backgroundWindow.prefs ? backgroundWindow.prefs : new Prefs();

export function getSync() {
  // For development mode
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return browser.storage.local;
  }
  try {
    if ('sync' in browser.storage) {
      return browser.storage.sync;
    }
  } catch (e) {
    // Do nothing
  }
  return browser.storage.local;
}

export function getLocal() {
  return browser.storage.local;
}
