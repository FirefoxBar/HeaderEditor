import browser from 'webextension-polyfill';
import * as storage from '@/share/core/storage';
import { TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import notify from '@/share/core/notify';
import { RULE_ACTION_OBJ } from '@/share/core/types';
import { getVirtualKey, isValidArray } from '@/share/core/utils';
import { getDatabase } from './core/db';
import { getAll, save, updateCache, waitLoad } from './core/rules';

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
    // Upgrade groups
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
        await rebindRuleWithGroup(g);
      } else {
        const r = await storage.getLocal().get('groups');
        if (r.groups !== undefined) {
          await rebindRuleWithGroup(r.groups);
          await storage.getLocal().remove('groups');
        } else {
          const g = {};
          g[browser.i18n.getMessage('ungrouped')] = [];
          await rebindRuleWithGroup(g);
        }
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
              local.set({ [storageKey]: res.map((x) => (typeof x === 'string' ? { [name]: x } : x)) });
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
    await Promise.all(tableToUpdate.map((table) => updateCache(table)));
  }

  if (version !== 2) {
    await storage.getLocal().set({
      version_mark: 2,
    });
  }
}

doUpgrade();
