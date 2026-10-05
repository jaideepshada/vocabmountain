import { useEffect, useCallback } from 'react';

interface KeyMap {
  readonly onSpace?: () => void;
  readonly onLeft?: () => void;
  readonly onRight?: () => void;
  readonly onKeyM?: () => void;
  readonly onKeyR?: () => void;
  readonly onEscape?: () => void;
}

/**
 * Binds keyboard shortcuts for the study view.
 * Space = flip, Left/Right = navigate, M = Memorised, R = missed.
 */
export function useKeyboard(keyMap: KeyMap, enabled = true): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          keyMap.onSpace?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          keyMap.onLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          keyMap.onRight?.();
          break;
        case 'KeyM':
          e.preventDefault();
          keyMap.onKeyM?.();
          break;
        case 'KeyR':
          e.preventDefault();
          keyMap.onKeyR?.();
          break;
        case 'Escape':
          e.preventDefault();
          keyMap.onEscape?.();
          break;
      }
    },
    [keyMap],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler, enabled]);
}
