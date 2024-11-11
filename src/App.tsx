// src/App.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import refreshSvg from './assets/refresh.svg';
import settingSvg from './assets/setting.svg';

import {
  register,
  isRegistered,
  unregisterAll,
} from '@tauri-apps/plugin-global-shortcut';

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  Container,
  IconButton,
  WindowItem,
  WindowList,
  SettingsGroup,
  ShortcutGroup,
  ShortcutInputBlock,
} from './styles';
import ShortcutInput from './components/ShortcutInput';
import { CLASSES_IMAGES, DEFAULT_SHORTCUTS } from './constants';

type DofusWindow = {
  title: string;
  hwnd: number;
  name: string;
  class: string;
};

const App: React.FC = () => {
  const [windows, setWindows] = useState<DofusWindow[]>([]);
  const [activeDofusWindow, setActiveDofusWindow] = useState<DofusWindow | null>(null);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [isAccordionOpen, setAccordionOpen] = useState(false);
  const [autoAdjustSize, setAutoAdjustSize] = useState(true);
  const [isFocusOnApp, setIsFocusOnApp] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});

  const contentRef = useRef<HTMLDivElement>(null);
  const [unlistenActiveWindow, setUnlistenActiveWindow] = useState<UnlistenFn | null>(null);
  const [unlistenFocus, setUnlistenFocus] = useState<UnlistenFn | null>(null);

  // Fetch shortcuts from localStorage or use defaults
  const fetchShortcuts = useCallback(() => {
    const savedShortcuts = localStorage.getItem('shortcuts');
    setShortcuts(savedShortcuts ? JSON.parse(savedShortcuts) : DEFAULT_SHORTCUTS);
  }, []);

  // Update shortcut in state and localStorage
  const updateShortcut = useCallback((action: string, shortcut: string) => {
    setShortcuts((prev) => {
      const updated = { ...prev, [action]: shortcut };
      localStorage.setItem('shortcuts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const adjustWindowSize = useCallback(async () => {
    if (contentRef.current) {
      console.log(contentRef.current)
      const { scrollHeight, scrollWidth } = contentRef.current;
      try {
        await invoke('set_window_size', {
          width: scrollWidth + 20,
          height: scrollHeight + 50,
        });
        console.log('Window size adjusted:', { scrollWidth, scrollHeight });
      } catch (error) {
        console.error('Error adjusting window size:', error);
      }
    }
  }, [windows.length]);

  useEffect(() => {
    if (!autoAdjustSize) return;
    adjustWindowSize();
  },[windows.length]);

  // Toggle Always on Top state
  const toggleAlwaysOnTop = useCallback(async () => {
    try {
      const newState = !alwaysOnTop;
      setAlwaysOnTop(newState);
      await invoke('set_tauri_always_on_top', { alwaysOnTop: newState });
    } catch (error) {
      console.error('Error setting always on top:', error);
    }
  }, [alwaysOnTop]);

  // Fetch windows
  const fetchWindows = useCallback(async () => {
    try {
      const result: DofusWindow[] = await invoke('get_dofus_windows');
      setWindows(result);
      console.log('Windows fetched:', result);
    } catch (error) {
      console.error('Error fetching windows:', error);
    }
  }, []);

  // Focus a specific window
  const focusWindow = useCallback(async (hwnd: number) => {
    try {
      await invoke('focus_window_command', { hwnd });
    } catch (error) {
      console.error('Error focusing window:', error);
    }
  }, []);

  // Handle shortcut actions
  const handleShortcutAction = useCallback(
    async (action: 'next' | 'prev') => {
      try {
        await invoke(`${action}_window`);
        console.log(`${action === 'next' ? 'Next' : 'Previous'} window triggered`);
      } catch (error) {
        console.error(`Error triggering ${action} window:`, error);
      }
    },
    []
  );

  // Handle shortcut changes
  const handleChangeShortcut = useCallback(
    (action: string, shortcut: string) => {
      updateShortcut(action, shortcut);
    },
    [updateShortcut]
  );

  // Setup and cleanup shortcuts
  useEffect(() => {
    const setupShortcuts = async () => {
      await unregisterAll();
      const actions: Array<'next' | 'prev'> = ['next', 'prev'];

      for (const action of actions) {
        const shortcut = shortcuts[action] || DEFAULT_SHORTCUTS[action];
        const isRegisteredFlag = await isRegistered(shortcut);
        if (!isRegisteredFlag) {
          await register(shortcut, (event) => {
            if (event.state === 'Pressed') {
              handleShortcutAction(action);
            }
          });
        }
      }
    };

    if (activeDofusWindow || isFocusOnApp) {
      setupShortcuts().catch(console.error);
    } else {
      unregisterAll().catch(console.error);
    }

    return () => {
      unregisterAll().catch(console.error);
    };
  }, [activeDofusWindow, isFocusOnApp, shortcuts, handleShortcutAction]);

  // Initial fetch and window size adjustment, plus setting up event listeners
  useEffect(() => {
    fetchShortcuts();
    fetchWindows();

    // Fonction asynchrone pour configurer les écouteurs d'événements
    const setupEventListeners = async () => {
      try {
        // Écouter les changements de fenêtre active
        const unlistenActive = await listen<DofusWindow | null>('active_window_changed', (event) => {
          console.log('active_window_changed', event.payload);
          setActiveDofusWindow(event.payload);
        });

        // Écouter les changements de focus sur l'application
        const unlistenFocus = await listen<boolean>('focus_changed', (event) => {
          console.log('focus_changed', event.payload);
          setIsFocusOnApp(event.payload);
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
  }, []);

  return (
    <Container ref={contentRef} id="titlebar">
      <div data-tauri-drag-region>     
      <Accordion>
        <AccordionHeader data-tauri-drag-region>
          <IconButton onClick={fetchWindows}><img src={refreshSvg} alt="refresh"  /></IconButton>
          <IconButton onClick={() => setAccordionOpen((prev) => !prev)}><img src={settingSvg} alt="refresh"  /></IconButton>
        </AccordionHeader>
        {isAccordionOpen && (
          <AccordionContent>
            <SettingsGroup>
              <label>
                <input
                  type="checkbox"
                  checked={alwaysOnTop}
                  onChange={toggleAlwaysOnTop}
                />
                Always on top
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={autoAdjustSize}
                  onChange={() => setAutoAdjustSize((prev) => !prev)}
                />
                Auto adjust window size
              </label>
            </SettingsGroup>

            <ShortcutGroup>
              {(['next', 'prev'] as const).map((action) => (
                  <ShortcutInputBlock key={action} >
                   <p> {action.charAt(0).toUpperCase() + action.slice(1)}:</p>
                    <ShortcutInput
                        onShortcutChange={(shortcut) => handleChangeShortcut(action, shortcut)}
                        disabled={false}
                        currentShortcut={shortcuts[action] || ''}
                      />
                  </ShortcutInputBlock>
        
              ))}
            </ShortcutGroup>
          </AccordionContent>
        )}
      </Accordion>

      <WindowList data-tauri-drag-region>
        {windows.map((win) => (
          <WindowItem
            key={win.hwnd}
            onClick={() => focusWindow(win.hwnd)}
            isSelected={activeDofusWindow?.hwnd === win.hwnd}
          >
            <img
              src={CLASSES_IMAGES[win.class.toLowerCase() as keyof typeof CLASSES_IMAGES] || CLASSES_IMAGES['unknown']}
              alt={win.class || 'unknown'}
            />
            <p>
              <strong>{win.name}</strong>
            </p>
          </WindowItem>
        ))}
      </WindowList>
      </div>
    </Container>
  );
};

export default App;
