import { useCallback, useState } from 'react';

export default function useExpanded() {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = useCallback((name: string) => {
    setExpanded(prev =>
      prev.includes(name) ? prev.filter(it => it !== name) : [...prev, name],
    );
  }, []);

  const expand = useCallback((name: string) => {
    setExpanded(prev => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  return { expanded, setExpanded, toggle, expand };
}
