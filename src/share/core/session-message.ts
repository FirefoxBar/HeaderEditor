import type Browser from 'webextension-polyfill';
import { getSession } from './storage';
import { isValidArray } from './utils';

export interface SessionMessageItem {
  id: string;
  time: number;
  type: 'info' | 'warning' | 'success';
  title: string;
  content: string;
  more?: string;
}

const get = async (): Promise<SessionMessageItem[]> => {
  const s = getSession();
  const { message } = await s.get('message');
  return isValidArray(message) ? message : [];
};

const add = async (msg: Omit<SessionMessageItem, 'id' | 'time'>) => {
  const s = getSession();
  const { message } = await s.get('message');
  const m = isValidArray(message) ? message : [];
  m.push({
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36)}`,
    time: Date.now(),
  });
  await s.set({ message: m });
};

const remove = async (id: string) => {
  const s = getSession();
  const { message } = await s.get('message');
  const m = isValidArray(message) ? message : [];
  const m2 = m.filter(item => item.id !== id);
  await s.set({ message: m2 });
};

type StorageOnChange = Parameters<
  Browser.Storage.StorageAreaWithUsage['onChanged']['addListener']
>[0];
const watch = (callback: (message: SessionMessageItem[]) => void) => {
  const s = getSession();

  const handleChange: StorageOnChange = changes => {
    if (changes.message) {
      const { oldValue = [], newValue = [] } = changes.message;
      // get new message
      const oldIds = (oldValue as SessionMessageItem[]).map(item => item.id);
      const newMsg = (newValue as SessionMessageItem[]).filter(
        item => !oldIds.includes(item.id),
      );
      callback(newMsg);
    }
  };

  s.onChanged.addListener(handleChange);

  return () => s.onChanged.removeListener(handleChange);
};

const SessionMessage = {
  get,
  add,
  remove,
  watch,
};

export default SessionMessage;
