import { useCallback, useRef, useState, useEffect, SetStateAction } from 'react';
import { getLocal, getSync } from '@/share/core/storage';

function useStorage<T = string>(key: string, defaultValue: T, useSync = false) {
  const ready = useRef(false);
  const [value, _setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const engine = useSync ? getSync() : getLocal();

    engine.get(key)
      .then((result) => {
        if (typeof result[key] !== 'undefined') {
          _setValue(result[key]);
        }
        ready.current = true;
      });

    const handleChange = (changes: any) => {
      if (typeof changes[key] === 'undefined') {
        return;
      }
      _setValue(changes[key].newValue);
    };

    if (engine.onChanged) {
      engine.onChanged.addListener(handleChange);
    }

    return () => {
      ready.current = false;
      if (engine.onChanged) {
        engine.onChanged.removeListener(handleChange);
      }
    };
  }, [key, useSync]);

  const setValue = useCallback((action: SetStateAction<T>) => {
    const engine = useSync ? getSync() : getLocal();
    if (typeof action === 'function') {
      _setValue((currentValue) => {
        const newValue = (action as ((prev: T) => T))(currentValue);
        engine.set({ [key]: newValue });
        return newValue;
      });
    } else {
      _setValue(action);
      engine.set({ [key]: action });
    }
  }, [key, useSync]);

  return {
    ready,
    value,
    setValue,
  };
}

export default useStorage;
