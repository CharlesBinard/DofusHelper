// src/components/ShortcutInput.tsx

import React, { useState, useEffect } from 'react';
import { VALID_KEYS } from './constants';

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


      const modKeys = [];
      if (e.ctrlKey) modKeys.push('Control');
      if (e.shiftKey) modKeys.push('Shift');
      if (e.altKey) modKeys.push('Alt');
      if (e.metaKey) modKeys.push('Meta');

      if (!VALID_KEYS.includes(e.code)) {
        console.warn("Invalid key:", e.code);
        return; // Ignore invalid keys
      }

      const formattedShortcut = [...modKeys, e.code].join("+");
      setShortcut(formattedShortcut);
      onShortcutChange(formattedShortcut);
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
        style={{ cursor: 'pointer', borderRadius: '5px' }}
      />
      {listening && <span> Listening...</span>}
    </div>
  );
};

export default ShortcutInput;
