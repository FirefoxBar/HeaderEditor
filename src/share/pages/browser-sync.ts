import { TABLE_NAMES_ARR } from '../core/constant';
import { getSync } from '../core/storage';
import { IS_CHROME } from '../core/utils';
import type { BasicRule } from '../core/types';

function getTotalCount(rules: { [key: string]: BasicRule[] }) {
  let count = 0;
  TABLE_NAMES_ARR.forEach((e) => {
    count += rules[e].length;
  });
  return count;
}

interface SyncMeta {
  time: number;
  index: number;
}

class BrowserSync {
  save(rules: { [key: string]: BasicRule[] }) {
    if (IS_CHROME) {
      const toSave: { [key: string]: any } = {};
      // split
      // @ts-ignore
      const limit = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 500;
      let index = 0;
      while (getTotalCount(rules) > 0) {
        const one: { [key: string]: BasicRule[] } = {};
        TABLE_NAMES_ARR.forEach((e) => {
          one[e] = [];
        });
        let t = 0;
        let toPut: BasicRule | null = null;
        while (JSON.stringify(one).length < limit) {
          // find available
          while (TABLE_NAMES_ARR[t] && rules[TABLE_NAMES_ARR[t]].length === 0) {
            t++;
          }
          if (!TABLE_NAMES_ARR[t]) {
            break;
          }
          toPut = rules[TABLE_NAMES_ARR[t]].splice(0, 1)[0];
          one[TABLE_NAMES_ARR[t]].push(toPut);
        }
        if (TABLE_NAMES_ARR[t] && toPut) {
          rules[TABLE_NAMES_ARR[t]].push(toPut);
          one[TABLE_NAMES_ARR[t]].splice(one[TABLE_NAMES_ARR[t]].indexOf(toPut), 1);
        }
        toSave[`backup_${index++}`] = one;
      }
      toSave.backup = {
        time: new Date().getTime(),
        index: index - 1,
      };
      return getSync().set(toSave);
    }

    return getSync().set({
      backup: {
        time: new Date().getTime(),
        index: 0,
      },
      backup_0: rules,
    });
  }
  async getMeta(): Promise<SyncMeta> {
    const e = await (getSync().get('backup'));
    return e.backup;
  }
  async getContent(): Promise<{ [key: string]: BasicRule[] }> {
    const e = await (getSync().get('backup'));
    const { index } = e.backup;
    const result: { [key: string]: BasicRule[] } = {};
    TABLE_NAMES_ARR.forEach((it) => {
      result[it] = [];
    });
    const toGet: string[] = [];
    for (let i = 0; i <= index; i++) {
      toGet.push(`backup_${i}`);
    }
    const res = await (getSync().get(toGet));
    toGet.forEach((name) => {
      TABLE_NAMES_ARR.forEach((it) => {
        result[it] = result[it].concat(res[name][it]);
      });
    });
    return result;
  }
  async clear() {
    const toRemove = ['backup'];
    const e = await (getSync().get('backup'));
    if (e.backup) {
      const { index } = e.backup;
      const result: { [key: string]: BasicRule[] } = {};
      TABLE_NAMES_ARR.forEach((it) => {
        result[it] = [];
      });
      for (let i = 0; i <= index; i++) {
        toRemove.push(`backup_${i}`);
      }
    }
    await getSync().remove(toRemove);
  }
}

export default new BrowserSync();
