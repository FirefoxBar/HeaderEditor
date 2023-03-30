import { useCallback, useRef, useState, useEffect } from 'react';
import { getLocal } from '@/share/core/storage';

type CommonMarkType = 'rule' | 'group';
const useMarkCommon = (type: CommonMarkType) => {
  const ready = useRef(false);
  const [keys, setKeys] = useState<string[]>([]);
  const storageKey = `common_${type}`;

  useEffect(() => {
    const local = getLocal();

    local.get(storageKey)
      .then((result) => {
        if (Array.isArray(result[storageKey])) {
          setKeys(result[storageKey]);
        }
        ready.current = true;
      });

    const handleChange = (changes: any) => {
      if (typeof changes[storageKey] === 'undefined') {
        return;
      }
      setKeys(changes[storageKey].newValue);
    };

    if (local.onChanged) {
      local.onChanged.addListener(handleChange);
    }

    return () => {
      ready.current = false;
      if (local.onChanged) {
        local.onChanged.removeListener(handleChange);
      }
    };
  }, []);

  const add = useCallback((key: string) => {
    if (!ready.current) {
      return;
    }
    setKeys((currentKeys) => {
      if (currentKeys.includes(key)) {
        return currentKeys;
      }
      const result = [...currentKeys, key];
      getLocal().set({ [storageKey]: result });
      return result;
    });
  }, []);

  const remove = useCallback((key: string) => {
    if (!ready.current) {
      return;
    }
    setKeys((currentKeys) => {
      if (!currentKeys.includes(key)) {
        return currentKeys;
      }
      const result = [...currentKeys];
      result.splice(result.indexOf(key), 1);
      getLocal().set({ [storageKey]: result });
      return result;
    });
  }, []);

  return {
    keys,
    add,
    remove,
  };
};

export default useMarkCommon;
