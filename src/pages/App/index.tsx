import React, { useEffect, useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import refreshSvg from '../../assets/refresh.svg';
import settingSvg from '../../assets/setting.svg';

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
import ShortcutInput from '../../components/ShortcutInput';
import { CLASSES_IMAGES, ShortcutAction } from './constants';
import useShortcuts from '../../hooks/useShortcuts';
import useWindowSizeAdjuster from '../../hooks/useWindowSizeAdjuster';
import useEventListeners from '../../hooks/useEventListeners';
import useGlobalShortcuts from '../../hooks/useGlobalShortcuts';

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
  const [isFocusOnAppOrDofus, setIsFocusOnAppOrDofus] = useState(true);

  const { shortcuts, fetchShortcuts, updateShortcut } = useShortcuts();

  const contentRef = useRef<HTMLDivElement>(null);

  useWindowSizeAdjuster(contentRef, autoAdjustSize, [windows.length, isAccordionOpen]);

  useEventListeners(setActiveDofusWindow, setIsFocusOnAppOrDofus);

  const handleShortcutAction = useCallback(
    async (action: ShortcutAction) => {
      try {
        if (action === 'click_all') {
          await invoke('click_all_windows');
        } else if (action === 'click_all_with_delay') {
          await invoke('click_all_windows_with_delay', { delay_ms: 100 });
        } else {
          await invoke(`${action}_window`);
        }
      } catch (error) {
        console.error(`Error triggering ${action} action:`, error);
      }
    },
    []
  );

  useGlobalShortcuts(isFocusOnAppOrDofus, shortcuts, handleShortcutAction);

  const handleChangeShortcut = useCallback(
    (action: string, shortcut: string) => {
      updateShortcut(action, shortcut);
    },
    [updateShortcut]
  );

  const toggleAlwaysOnTop = useCallback(async () => {
    try {
      const newState = !alwaysOnTop;
      setAlwaysOnTop(newState);
      await invoke('set_tauri_always_on_top', { alwaysOnTop: newState });
    } catch (error) {
      console.error('Error setting always on top:', error);
    }
  }, [alwaysOnTop]);

  const fetchWindows = useCallback(async () => {
    try {
      const result: DofusWindow[] = await invoke('get_dofus_windows');
      setWindows(result);
    } catch (error) {
      console.error('Error fetching windows:', error);
    }
  }, []);

  const focusWindow = useCallback(async (hwnd: number) => {
    try {
      await invoke('focus_window_command', { hwnd });
    } catch (error) {
      console.error('Error focusing window:', error);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();
    fetchWindows();
  }, [fetchShortcuts, fetchWindows]);

  return (
    <Container ref={contentRef} id="titlebar">
      <div data-tauri-drag-region>
        <Accordion>
          <AccordionHeader data-tauri-drag-region>
            <IconButton onClick={fetchWindows}>
              <img src={refreshSvg} alt="refresh" />
            </IconButton>
            <IconButton onClick={() => setAccordionOpen((prev) => !prev)}>
              <img src={settingSvg} alt="settings" />
            </IconButton>
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
                {(['next', 'prev', 'click_all', 'click_all_with_delay'] as const).map((action) => (
                  <ShortcutInputBlock key={action}>
                    <p>{action.charAt(0).toUpperCase() + action.slice(1)}:</p>
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
                src={
                  CLASSES_IMAGES[win.class.toLowerCase() as keyof typeof CLASSES_IMAGES] ||
                  CLASSES_IMAGES['unknown']
                }
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
