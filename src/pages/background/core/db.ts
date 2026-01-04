import { TABLE_NAME_TASKS, TABLE_NAMES_ARR } from '@/share/core/constant';
import { upgradeRuleFormat } from '@/share/core/rule-utils';
import { getGlobal } from '@/share/core/utils';

export function getDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const dbOpenRequest = getGlobal().indexedDB.open('headereditor', 5);
    dbOpenRequest.onsuccess = e => {
      resolve((e.target as any).result as IDBDatabase);
    };
    dbOpenRequest.onerror = e => {
      console.error(e);
      reject(e);
    };
    dbOpenRequest.onupgradeneeded = event => {
      const handler = (event.target as any).result as IDBDatabase;
      if (event.oldVersion === 0) {
        // Installed
        TABLE_NAMES_ARR.forEach(t =>
          handler.createObjectStore(t, { keyPath: 'id', autoIncrement: true }),
        );
        handler.createObjectStore(TABLE_NAME_TASKS, {
          keyPath: 'key',
          autoIncrement: true,
        });
        return;
      }

      if (event.oldVersion < 5) {
        handler.createObjectStore(TABLE_NAME_TASKS, {
          keyPath: 'key',
          autoIncrement: true,
        });
      }

      if (event.oldVersion < 4) {
        TABLE_NAMES_ARR.forEach(k => {
          const tx = (event.target as any).transaction as IDBTransaction;
          if (!tx.objectStoreNames.contains(k)) {
            handler.createObjectStore(k, {
              keyPath: 'id',
              autoIncrement: true,
            });
            return;
          }
          const os = tx.objectStore(k);
          os.openCursor().onsuccess = event => {
            const cursor: IDBCursorWithValue = (event.target as any)?.result;
            if (!cursor) {
              return;
            }
            const s = cursor.value;
            s.id = cursor.key;
            // upgrade rule format
            os.put(upgradeRuleFormat(s));
            cursor.continue();
          };
        });
      }
    };
  });
}
