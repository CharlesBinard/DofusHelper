import { useCallback, useState } from 'react';
import { DEFAULT_SHORTCUTS } from '../pages/App/constants';

const useShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});

  const fetchShortcuts = useCallback(() => {
    const savedShortcuts = localStorage.getItem('shortcuts');
    setShortcuts(savedShortcuts ? JSON.parse(savedShortcuts) : DEFAULT_SHORTCUTS);
  }, []);

  const updateShortcut = useCallback((action: string, shortcut: string) => {
    setShortcuts((prev) => {
      const updated = { ...prev, [action]: shortcut };
      localStorage.setItem('shortcuts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { shortcuts, fetchShortcuts, updateShortcut };
};

export default useShortcuts;
