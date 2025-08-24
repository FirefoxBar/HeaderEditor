import { useCallback, useEffect, useState } from 'react';
import { defaultPrefValue } from '../core/constant';
import emitter from '../core/emitter';
import { prefs } from '../core/prefs';
import type { PrefValue } from '../core/types';

const usePref = <K extends keyof PrefValue>(key: K) => {
  const [state, setState] = useState(defaultPrefValue[key]);

  useEffect(() => {
    prefs.ready(() => {
      setState(prefs.get(key));
    });
    const handler = (k: keyof PrefValue, val: any) => {
      if (key === k) {
        setState(val);
      }
    };
    emitter.on(emitter.EVENT_PREFS_UPDATE, handler);
    return () => {
      emitter.off(emitter.EVENT_PREFS_UPDATE, handler);
    };
  }, []);

  const set = useCallback((value: PrefValue[K]) => {
    prefs.set(key, value);
    setState(value);
  }, []);

  return [state, set];
};

export default usePref;
