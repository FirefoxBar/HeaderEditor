import { useCallback } from 'react';
import useStorage from './use-storage';

type CommonMarkType = 'rule' | 'group';
const useMarkCommon = (type: CommonMarkType) => {
  const storageKey = `common_${type}`;

  const storage = useStorage<string[]>(storageKey, [], false);

  const add = useCallback((key: string) => {
    if (!storage.ready.current) {
      return;
    }
    storage.setValue((currentKeys) => {
      if (currentKeys.includes(key)) {
        return currentKeys;
      }
      const result = [...currentKeys, key];
      return result;
    });
  }, []);

  const remove = useCallback((key: string) => {
    if (!storage.ready.current) {
      return;
    }
    storage.setValue((currentKeys) => {
      if (!currentKeys.includes(key)) {
        return currentKeys;
      }
      const result = [...currentKeys];
      result.splice(result.indexOf(key), 1);
      return result;
    });
  }, []);

  return {
    keys: storage.value,
    add,
    remove,
  };
};

export default useMarkCommon;
