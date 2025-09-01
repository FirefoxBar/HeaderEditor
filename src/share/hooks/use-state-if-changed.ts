import { useCallback, useRef, useState } from 'react';

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

function useStateIfChanged<T>(
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const prevValueRef = useRef<T>(initialValue);

  const setStateIfChanged = useCallback((newValue: SetStateAction<T>) => {
    const resolvedValue =
      typeof newValue === 'function'
        ? (newValue as (prevState: T) => T)(prevValueRef.current)
        : newValue;

    if (prevValueRef.current !== resolvedValue) {
      prevValueRef.current = resolvedValue;
      setState(resolvedValue);
    }
  }, []);

  return [state, setStateIfChanged];
}

export default useStateIfChanged;
