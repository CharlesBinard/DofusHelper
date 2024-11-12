import { useEffect } from 'react';
import {
  register,
  isRegistered,
  unregisterAll,
} from '@tauri-apps/plugin-global-shortcut';
import { ShortcutAction, DEFAULT_SHORTCUTS } from '../pages/App/constants';

const useGlobalShortcuts = (
  isFocusOnAppOrDofus: boolean,
  shortcuts: Record<string, string>,
  handleShortcutAction: (action: ShortcutAction) => void
) => {
  console.log(" shortcuts", shortcuts)
  useEffect(() => {
    const setupShortcuts = async () => {
      await unregisterAll();
      const actions: Array<ShortcutAction> = ['next', 'prev', 'click_all', 'click_all_with_delay'];

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

    if (isFocusOnAppOrDofus) {
      setupShortcuts().catch(console.error);
    } else {
      unregisterAll().catch(console.error);
    }

    return () => {
      unregisterAll().catch(console.error);
    };
  }, [isFocusOnAppOrDofus, shortcuts, handleShortcutAction]);
};

export default useGlobalShortcuts;
