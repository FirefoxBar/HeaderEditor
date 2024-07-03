import { getLocal } from './storage';

const addHistory = (key: string, value: string) => {
  const engine = getLocal();
  engine.get(key).then((result) => {
    engine.set({ [key]: result[key] });
  });
};
