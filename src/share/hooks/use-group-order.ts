import { useCallback, useMemo } from 'react';
import useStorage from '@/share/hooks/use-storage';

export default function useGroupOrder(groupNames: string[]) {
  const storage = useStorage<string[]>('group_order', [], true);

  const orderedNames = useMemo(() => {
    const ordered = storage.value.filter(name => groupNames.includes(name));
    const rest = groupNames.filter(name => !ordered.includes(name));
    return [...ordered, ...rest];
  }, [storage.value, groupNames]);

  const saveOrder = useCallback(
    (names: string[]) => storage.setValue(names),
    [storage.setValue],
  );

  return { orderedNames, saveOrder };
}
