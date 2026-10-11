import type { MockRequest } from '@/pages/options/components/request-mock';
import { getLocal, getSingle } from '@/share/core/storage';

const STORAGE_KEY = 'rule_filter_saved';

export interface SavedFilterResponseHeader {
  name: string;
  value?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  createdAt: number;
  filter: MockRequest;
}

export type SavedFilterInput = Omit<SavedFilter, 'id' | 'createdAt'>;

/** 读取全部已保存的筛选项 */
export async function loadSavedFilters(): Promise<SavedFilter[]> {
  const list = await getSingle<SavedFilter[]>(getLocal(), STORAGE_KEY);
  return Array.isArray(list) ? list : [];
}

/**
 * 保存筛选项
 */
export async function saveFilter(input: SavedFilterInput): Promise<void> {
  const list = await loadSavedFilters();
  list.push({
    ...input,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  await getLocal().set({ [STORAGE_KEY]: list });
}

/** 删除已保存的筛选项 */
export async function removeFilter(id: string): Promise<void> {
  const list = await loadSavedFilters();
  const next = list.filter(it => it.id !== id);
  if (next.length !== list.length) {
    await getLocal().set({ [STORAGE_KEY]: next });
  }
}
