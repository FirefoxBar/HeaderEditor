import isEqual from 'fast-deep-equal';
import browser from 'webextension-polyfill';
import { defaultPrefValue } from './constant';
import emitter from './emitter';
import { getSync } from './storage';
import type { PrefValue } from './types';

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
        const synced: any = result.settings;
        for (const key in defaultPrefValue) {
          if (synced && key in synced) {
            this.set(key, synced[key], true);
          }
        }
        this.isDefault = false;
        emitter.emit(emitter.EVENT_PREFS_READY);
      });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && 'settings' in changes) {
        const synced: any = changes.settings.newValue;
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
  }

  get<K extends keyof PrefValue>(
    key: K,
    defaultValue?: PrefValue[K],
  ): PrefValue[K] {
    if (key in this.boundMethods) {
      if (key in this.boundWrappers) {
        return this.boundWrappers[key];
      } else if (key in this.values) {
        this.boundWrappers[key] = this.boundMethods[key](this.values[key]);
        return this.boundWrappers[key];
      }
    }
    if (key in this.values) {
      return this.values[key];
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return defaultPrefValue[key];
  }

  getAll() {
    return { ...this.values };
  }

  set(key: string, value: any, noSync = false) {
    const oldValue = this.values[key as keyof PrefValue];
    if (!isEqual(value, oldValue)) {
      (this.values as any)[key] = value;
      emitter.emit(emitter.EVENT_PREFS_UPDATE, key, value);
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
      emitter.once(emitter.EVENT_PREFS_READY, cb);
    }
  }
}

export const prefs = new Prefs();
