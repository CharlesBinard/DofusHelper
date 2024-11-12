const VALID_KEYS = new Set([
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10',
    'F11', 'F12', '`', '-', '=', '[', ']', '\\', ';', '\'', ',', '.', '/',
    '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}',
    '|', ':', '"', '<', '>', '?',
    'ESCAPE', 'TAB', 'CAPSLOCK', 'SHIFT', 'CONTROL', 'ALT', 'META', 'SPACE',
    'ENTER', 'BACKSPACE', 'INSERT', 'DELETE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN',
    'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT',
  ]);
  
  const MODIFIER_KEYS = new Set(['CTRL', 'SHIFT', 'ALT', 'META']);
  
  export const isValidShortcut = (shortcut: string): boolean => {
    const parts = shortcut.split('+').map(part => part.toUpperCase());
  
    if (parts.length === 0) return false;
  
    // Check that all parts are valid keys
    return parts.every(part => VALID_KEYS.has(part) || MODIFIER_KEYS.has(part));
  };