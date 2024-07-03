import { useEffect, useState } from 'react';
import { prefs } from '../core/prefs';
import emitter from '../core/emitter';

function useOption<T = any>(key: string, defaultValue?: T): T | undefined {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    prefs.ready(() => {
      setState(prefs.get(key));
    });
    const handleUpdate = () => {
      setState(prefs.get(key));
    };
    emitter.on(emitter.EVENT_PREFS_UPDATE, handleUpdate);
    return () => {
      emitter.off(emitter.EVENT_PREFS_UPDATE, handleUpdate);
    };
  }, [key]);

  return state;
}

export default useOption;
