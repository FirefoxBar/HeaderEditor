import browser from 'webextension-polyfill';
import * as storage from '@/share/core/storage';
import { TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import notify from '@/share/core/notify';
import { RULE_ACTION_OBJ } from '@/share/core/types';
import { getVirtualKey, isValidArray } from '@/share/core/utils';
import { getDatabase } from './core/db';
import { getAll, save, updateCache, waitLoad } from './core/rules';

// Upgrade
async function doUpgrade() {
  if (typeof localStorage !== 'undefined') {
    const downloadHistory = localStorage.getItem('dl_history');
    if (downloadHistory) {
      storage.getLocal().set({ dl_history: JSON.parse(downloadHistory) });
      localStorage.removeItem('dl_history');
    }
  }

  // Put a version mark
  const currentVersionMark: any = await storage.getLocal().get('version_mark');
  let version = Number(currentVersionMark.version_mark);
  if (Number.isNaN(version)) {
    version = 0;
  }
  if (version < 1) {
    // Upgrade group
    const rebindRuleWithGroup = (group) => {
      return new Promise((resolve) => {
        const cacheQueue: Array<Promise<void>> = [];
        function findGroup(type, id) {
          let result = browser.i18n.getMessage('ungrouped');
          for (const k in group) {
            if (group[k].includes(`${type}-${id}`)) {
              result = k;
              break;
            }
          }
          return result;
        }
        TABLE_NAMES_ARR.forEach((k) => {
          getDatabase().then((db) => {
            const tx = db.transaction([k], 'readwrite');
            const os = tx.objectStore(k);
            os.openCursor().onsuccess = (e) => {
              if (!e.target) {
                return;
              }
              const cursor = (e.target as any).result;
              if (cursor) {
                const s = cursor.value;
                s.id = cursor.key;
                if (typeof s.group === 'undefined') {
                  s.group = findGroup(k, s.id);
                  os.put(s);
                }
                cursor.continue();
              } else {
                cacheQueue.push(notify.other({ method: 'updateCache', type: k }));
              }
            };
          });
        });
        Promise.all(cacheQueue).then(resolve);
      });
    };

    if (typeof localStorage !== 'undefined') {
      const groups = localStorage.getItem('groups');
      if (groups) {
        const g = JSON.parse(groups);
        localStorage.removeItem('groups');
        rebindRuleWithGroup(g);
      } else {
        storage
          .getLocal()
          .get('groups')
          .then((r) => {
            if (r.groups !== undefined) {
              rebindRuleWithGroup(r.groups).then(() => storage.getLocal().remove('groups'));
            } else {
              const g = {};
              g[browser.i18n.getMessage('ungrouped')] = [];
              rebindRuleWithGroup(g);
            }
          });
      }
    }
  }

  if (version < 2) {
    await waitLoad();
    const all = getAll();
    const queue: Array<Promise<any>> = [];
    const tableToUpdate: TABLE_NAMES[] = [];
    const local = storage.getLocal();
    TABLE_NAMES_ARR.forEach((table) => {
      const rules = all[table];
      rules?.forEach((r) => {
        if (typeof r.action === 'object') {
          const { name } = r.action as RULE_ACTION_OBJ;
          const storageKey = `rule_switch_${getVirtualKey(r)}`;
          local
            .get(storageKey)
            .then((res) => res[storageKey])
            .then((res) => {
              if (!isValidArray<string>(res)) {
                return;
              }
              local.set({ [storageKey]: res.map((x) => ({ [name]: x })) });
            });
        }
        if (!r.condition) {
          // call save will auto call "upgradeRuleFormat"
          queue.push(save(r));
          if (!tableToUpdate.includes(table)) {
            tableToUpdate.push(table);
          }
        }
      });
    });
    await Promise.all(queue);
    tableToUpdate.forEach((table) => {
      updateCache(table);
    });
    // rule_switch_
  }

  storage.getLocal().set({
    version_mark: 2,
  });
}

if (MANIFEST_VER === 'v3') {
  browser.runtime.onInstalled.addListener((details) => {
    if (IS_DEV) {
      console.log('chrome onInstalled', details);
    }
    if (details.reason !== 'install' && details.reason !== 'update') {
      return;
    }
    doUpgrade();
  });
} else {
  doUpgrade();
}
