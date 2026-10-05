import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  readonly onSwipeLeft?: () => void;
  readonly onSwipeRight?: () => void;
  readonly onTap?: () => void;
}

interface SwipeBindings {
  readonly onTouchStart: (e: React.TouchEvent) => void;
  readonly onTouchMove: (e: React.TouchEvent) => void;
  readonly onTouchEnd: (e: React.TouchEvent) => void;
}

const SWIPE_THRESHOLD = 50;
const TAP_THRESHOLD = 10;
const SWIPE_TIME_LIMIT = 300;

/**
 * Touch gesture handler: swipe left/right to navigate, tap to flip.
 * Returns event handlers to spread onto the target element.
 */
export function useSwipe(handlers: SwipeHandlers): SwipeBindings {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const moved = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    moved.current = false;
  }, []);

  const onTouchMove = useCallback((_e: React.TouchEvent) => {
    moved.current = true;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const elapsed = Date.now() - startTime.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Swipe detection: horizontal dominant, fast enough, long enough
      if (absDx > SWIPE_THRESHOLD && absDx > absDy * 1.5 && elapsed < SWIPE_TIME_LIMIT) {
        if (dx < 0) {
          handlers.onSwipeLeft?.();
        } else {
          handlers.onSwipeRight?.();
        }
        return;
      }

      // Tap detection: small movement
      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD && !moved.current) {
        handlers.onTap?.();
      }
    },
    [handlers],
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
