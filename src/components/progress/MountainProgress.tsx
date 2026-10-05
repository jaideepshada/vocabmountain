import React, { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface MountainProgressProps {
  coveredDays: ReadonlySet<number>;
  compact?: boolean;
}

export const MountainProgress: React.FC<MountainProgressProps> = ({ coveredDays, compact = false }) => {
  const TOTAL_DAYS = 34;
  const coveredCount = coveredDays.size;
  const fillRatio = coveredCount / TOTAL_DAYS;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const prefersReducedMotion = useReducedMotion();

  // 34 waypoints: zigzag path ascending left-to-right
  const points = useMemo(() => {
    const pts: { x: number; y: number; day: number; covered: boolean }[] = [];
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const t = i / (TOTAL_DAYS - 1);
      const x = 80 + t * 640 + Math.sin(t * Math.PI * 5) * 40;
      const y = 340 - t * 280;
      pts.push({ x, y, day: i + 1, covered: coveredDays.has(i + 1) });
    }
    return pts;
  }, [coveredDays]);

  const first = points[0];
  const pathD = first
    ? `M ${first.x} ${first.y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // The fill rect starts fully below (y offset = 0) and rises to fillRatio
  // translateY goes from 0 (no fill) to -fillRatio*350 (full fill)
  const fillTranslateY = -fillRatio * 350;

  const staticState = prefersReducedMotion;

  return (
    <div
      ref={ref}
      className={compact ? 'w-full max-w-sm mx-auto' : 'w-full py-4'}
      role="img"
      aria-label={`${coveredCount} of 34 days covered`}
    >
      {!compact && (
        <div className="text-center mb-4">
          <h2 className="font-serif text-2xl text-ink">Vocab Mountain</h2>
          <p className="text-ink-secondary text-sm mt-1">{coveredCount} of 34 days covered</p>
        </div>
      )}

      {compact && (
        <p className="text-center text-xs text-ink-secondary mb-2">{coveredCount} of 34 days covered</p>
      )}

      {/* SVG Scene */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-surface-raised shadow-soft" style={{ aspectRatio: compact ? '3/1' : '2/1' }}>
        <svg
          viewBox={compact ? '0 100 800 200' : '0 0 800 400'}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Defs: clip path for the mountain fill */}
          <defs>
            <clipPath id={compact ? 'mountain-mask-compact' : 'mountain-mask-full'}>
              <polygon points="50,400 400,50 750,400" />
            </clipPath>
          </defs>

          {/* Background ridges */}
          <polygon points="0,400 180,230 360,400" fill="var(--color-border-subtle)" opacity="0.4" />
          <polygon points="440,400 650,170 800,400" fill="var(--color-border-subtle)" opacity="0.4" />
          <polygon points="200,400 420,240 640,400" fill="var(--color-border-subtle)" opacity="0.6" />

          {/* Main mountain body */}
          <polygon points="50,400 400,50 750,400" fill="var(--color-surface)" />
          <polygon points="50,400 400,50 750,400" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeLinejoin="round" />

          {/* Progress fill — translates upward from y=400 */}
          <motion.g
            clipPath={`url(#${compact ? 'mountain-mask-compact' : 'mountain-mask-full'})`}
            initial={{ y: 0 }}
            animate={staticState ? { y: fillTranslateY } : (isInView ? { y: fillTranslateY } : { y: 0 })}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <rect x="0" y="50" width="800" height="350" fill="var(--color-accent-subtle)" />
            {/* A subtle shimmer line at the snow line */}
            {fillRatio > 0 && (
              <line
                x1="0" y1="400" x2="800" y2="400"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                opacity="0.5"
              />
            )}
          </motion.g>

          {/* Route line */}
          {!compact && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="var(--color-ink-tertiary)"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut', opacity: { duration: 0.3 } }}
            />
          )}

          {/* Waypoints */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={compact ? 3.5 : 5}
              fill={p.covered ? 'var(--color-accent)' : 'var(--color-surface-raised)'}
              stroke={p.covered ? 'var(--color-surface)' : 'var(--color-border-subtle)'}
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={
                staticState
                  ? { duration: 0 }
                  : { delay: 0.5 + i * 0.025, duration: 0.3, ease: 'easeOut' }
              }
            />
          ))}

          {/* Slow cloud drift (only full, not reduced motion) */}
          {!compact && !prefersReducedMotion && (
            <>
              <motion.ellipse
                cx="0" cy="30" rx="55" ry="18"
                fill="var(--color-surface-overlay)"
                opacity="0.7"
                animate={{ x: [900, -120] }}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
              />
              <motion.ellipse
                cx="0" cy="60" rx="40" ry="13"
                fill="var(--color-surface-overlay)"
                opacity="0.5"
                animate={{ x: [900, -120] }}
                transition={{ duration: 130, repeat: Infinity, ease: 'linear', delay: 45 }}
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
