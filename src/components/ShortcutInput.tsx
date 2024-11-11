// src/components/ShortcutInput.tsx

import React, { useState, useEffect } from 'react';

type ShortcutInputProps = {
  onShortcutChange: (shortcut: string) => void;
  disabled?: boolean;
  currentShortcut: string;
};

const ShortcutInput: React.FC<ShortcutInputProps> = ({
  onShortcutChange,
  disabled,
  currentShortcut,
}) => {
  const [listening, setListening] = useState(false);
  const [shortcut, setShortcut] = useState(currentShortcut);

  useEffect(() => {
    setShortcut(currentShortcut);
  }, [currentShortcut]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      if (e.metaKey) keys.push('Meta');

      const key = e.key.toUpperCase();
      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key) && key !== 'COMMAND') {
        keys.push(key);
      }

      const shortcutStr = keys.join('+');
      setShortcut(shortcutStr);
      onShortcutChange(shortcutStr);
      setListening(false);
      window.removeEventListener('keydown', handleKeyDown);
    };

    if (listening) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [listening, onShortcutChange]);

  const handleClick = () => {
    if (!disabled) {
      setListening(true);
      setShortcut('');
    }
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: '10px' }}>
      <input
        type="text"
        value={shortcut}
        readOnly
        placeholder="Press shortcut..."
        onClick={handleClick}
        style={{ cursor: 'pointer', width: '50px', borderRadius: '5px' }}
      />
      {listening && <span> Listening...</span>}
    </div>
  );
};

export default ShortcutInput;
