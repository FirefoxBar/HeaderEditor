import { type TABLE_NAMES, TABLE_NAMES_ARR } from '@/share/core/constant';
import * as storage from '@/share/core/storage';
import type { RULE_ACTION_OBJ } from '@/share/core/types';
import { getVirtualKey, isValidArray } from '@/share/core/utils';
import { getAll, save, updateCache, waitLoad } from './core/rules';

export async function doUpgrade() {
  // Put a version mark
  const currentVersionMark: any = await storage.getLocal().get('version_mark');
  let version = Number(currentVersionMark.version_mark);
  if (Number.isNaN(version)) {
    version = 0;
  }

  if (version < 2) {
    await waitLoad();
    const all = getAll();
    const queue: Array<Promise<any>> = [];
    const tableToUpdate: TABLE_NAMES[] = [];
    const local = storage.getLocal();
    TABLE_NAMES_ARR.forEach(table => {
      const rules = all[table];
      rules?.forEach(r => {
        if (typeof r.action === 'object') {
          const { name } = r.action as RULE_ACTION_OBJ;
          const storageKey = `rule_switch_${getVirtualKey(r)}`;
          local
            .get(storageKey)
            .then(res => res[storageKey])
            .then(res => {
              if (!isValidArray<string>(res)) {
                return;
              }
              local.set({
                [storageKey]: res.map(x =>
                  typeof x === 'string' ? { [name]: x } : x,
                ),
              });
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
    await Promise.all(tableToUpdate.map(table => updateCache(table)));
  }

  if (version !== 2) {
    await storage.getLocal().set({
      version_mark: 2,
    });
  }
}
