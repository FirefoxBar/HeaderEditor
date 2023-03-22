import browser from 'webextension-polyfill';
import * as storage from '@/share/core/storage';
import { TABLE_NAMES_ARR } from '@/share/core/constant';
import notify from '@/share/core/notify';
import { getDatabase } from './core/db';

// Upgrade
const downloadHistory = localStorage.getItem('dl_history');
if (downloadHistory) {
  storage.getLocal().set({ dl_history: JSON.parse(downloadHistory) });
  localStorage.removeItem('dl_history');
}

// Put a version mark
storage
  .getLocal()
  .get('version_mark')
  .then((v) => {
    const version = v.version_mark ? parseInt(v.version_mark, 10) : 0;
    if (!(version >= 1)) {
      storage.getLocal().set({
        version_mark: 1,
      });
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
  });
