import { getLocal } from '@/share/core/storage';
import { useRef, useState, useEffect } from 'react';

const useMarkCommon = (type: 'rule' | 'group') => {
  const ready = useRef(false);
  const [keys, setKeys] = useState<string[]>([]);
  const storageKey = `common_${type}`;

  useEffect(() => {
    const local = getLocal();

    local.get(storageKey)
      .then(result => {
        if (Array.isArray(result)) {
          setKeys(result);
        }
        ready.current = true;
      });

    const handleChange = (changes: any) => {
      if (typeof changes[storageKey] === 'undefined') {
        return;
      }
      setKeys(changes[storageKey]);
    };

    if (local.onChange) {
      local.onChange.addListener(handleChange);
    }

    return () => {
      ready.current = false;
      if (local.onChange) {
        local.onChange.removeListener(handleChange);
      }
    };
  }, []);

  const add = useCallback((key: string) => {
    if (!ready.current) {
      return;
    }
    setKeys(currentKeys => {
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
    setKeys(currentKeys => {
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
}

export default useMarkCommon;