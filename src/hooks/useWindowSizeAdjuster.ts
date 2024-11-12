import { useCallback, useEffect, RefObject } from 'react';
import { invoke } from '@tauri-apps/api/core';

const useWindowSizeAdjuster = (
  contentRef: RefObject<HTMLDivElement>,
  autoAdjustSize: boolean,
  dependencies: any[] = []
) => {
  const adjustWindowSize = useCallback(async () => {
    if (contentRef.current) {
      const { scrollHeight, scrollWidth } = contentRef.current;
      try {
        await invoke('set_window_size', {
          width: scrollWidth + 20,
          height: scrollHeight + 50,
        });
      } catch (error) {
        console.error('Error adjusting window size:', error);
      }
    }
  }, [contentRef]);

  useEffect(() => {
    if (autoAdjustSize) {
      adjustWindowSize();
    }
  }, [autoAdjustSize, adjustWindowSize, ...dependencies]);

  return adjustWindowSize;
};

export default useWindowSizeAdjuster;
