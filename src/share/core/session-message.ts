import { getSession } from './storage';
import { isValidArray } from './utils';

export interface SessionMessageItem {
  id: string;
  time: number;
  type: 'info' | 'warning' | 'success';
  title: string;
  content: string;
}

const get = async (): Promise<SessionMessageItem[]> => {
  const s = getSession();
  const { message } = await s.get('message');
  return isValidArray(message) ? message : [];
};

const add = async (
  type: SessionMessageItem['type'],
  title: string,
  content: string,
) => {
  const s = getSession();
  const { message } = await s.get('message');
  const m = isValidArray(message) ? message : [];
  m.push({
    id: Math.random().toString(36),
    time: Date.now(),
    type,
    title,
    content,
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

const watch = async (callback: (message: SessionMessageItem[]) => void) => {
  const s = getSession();
  s.onChanged.addListener(changes => {
    if (changes.message) {
      const { oldValue = [], newValue = [] } = changes.message;
      // get new message
      const oldIds = (oldValue as SessionMessageItem[]).map(item => item.id);
      const newMsg = (newValue as SessionMessageItem[]).filter(
        item => !oldIds.includes(item.id),
      );
      callback(newMsg);
    }
  });
};

const SessionMessage = {
  get,
  add,
  remove,
  watch,
};

export default SessionMessage;
