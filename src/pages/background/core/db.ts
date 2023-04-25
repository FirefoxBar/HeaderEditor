import { TABLE_NAMES_ARR } from '@/share/core/constant';
import { upgradeRuleFormat } from '@/share/core/rule-utils';
import { getGlobal } from '@/share/core/utils';

export function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbOpenRequest = getGlobal().indexedDB.open('headereditor', 4);
    dbOpenRequest.onsuccess = (e) => {
      // @ts-ignore
      resolve(e.target.result);
    };
    dbOpenRequest.onerror = (e) => {
      console.error(e);
      reject(e);
    };
    dbOpenRequest.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) {
        // Installed
        TABLE_NAMES_ARR.forEach((t) => {
          // @ts-ignore
          event.target.result.createObjectStore(t, { keyPath: 'id', autoIncrement: true });
        });
      } else {
        TABLE_NAMES_ARR.forEach((k) => {
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
