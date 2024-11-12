import { useEffect, useState } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

type DofusWindow = {
  title: string;
  hwnd: number;
  name: string;
  class: string;
};

const useEventListeners = (
  setActiveDofusWindow: (win: DofusWindow | null) => void,
  setIsFocusOnAppOrDofus: (focused: boolean) => void
) => {
  const [unlistenActiveWindow, setUnlistenActiveWindow] = useState<UnlistenFn | null>(null);
  const [unlistenFocus, setUnlistenFocus] = useState<UnlistenFn | null>(null);

  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const unlistenActive = await listen<DofusWindow | null>('active_dofus_changed', (event) => {
          setActiveDofusWindow(event.payload);
        });

        const unlistenFocus = await listen<boolean>('is_focused_on_app_or_dofus', (event) => {
          setIsFocusOnAppOrDofus(event.payload);
        });

        setUnlistenActiveWindow(() => unlistenActive);
        setUnlistenFocus(() => unlistenFocus);
      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    };

    setupEventListeners();

    return () => {
      if (unlistenActiveWindow) unlistenActiveWindow();
      if (unlistenFocus) unlistenFocus();
    };
  }, [setActiveDofusWindow, setIsFocusOnAppOrDofus, unlistenActiveWindow, unlistenFocus]);

  return {};
};

export default useEventListeners;
