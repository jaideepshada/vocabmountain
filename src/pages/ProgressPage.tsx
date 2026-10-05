import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../core/types';
import { NavBar } from '../components/layout/NavBar';
import { useAllSessions, useAllEvents } from '../db/hooks';
import { DayPickerGrid } from '../components/shared/DayPickerGrid';

interface ProgressPageProps {
  deck: Deck;
}

export function ProgressPage({ deck: _deck }: ProgressPageProps) {
  const navigate = useNavigate();
  const allSessions = useAllSessions();
  const allEvents = useAllEvents();

  const stats = useMemo(() => {
    const completedSessions = allSessions.filter((s) => s.completedAt !== null);

    const completedDaysSet = new Set<number>();
    completedSessions.forEach((s) => {
      for (let d = s.scope.startDay; d <= s.scope.endDay; d++) completedDaysSet.add(d);
    });

    const startedDaysSet = new Set<number>();
    allSessions.forEach((s) => {
      for (let d = s.scope.startDay; d <= s.scope.endDay; d++) startedDaysSet.add(d);
    });

    const uniqueWordIds = new Set<number>();
    allEvents.forEach((e) => uniqueWordIds.add(e.wordId));

    return {
      completedCount: completedSessions.length,
      daysCovered: completedDaysSet.size,
      completedDays: completedDaysSet,
      startedDays: startedDaysSet,
      wordsSeen: uniqueWordIds.size,
      totalReviews: allEvents.length,
    };
  }, [allSessions, allEvents]);

  const fillPercent = (stats.daysCovered / 34) * 100;

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <NavBar title="Progress" showBack onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Mountain visualization */}
        <div className="flex justify-center">
          <div className="relative w-48 h-32" aria-label={`${stats.daysCovered} of 34 days completed`}>
            <svg viewBox="0 0 100 60" className="w-full h-full" fill="none" aria-hidden="true">
              {/* Fill (clipped to progress) */}
              <clipPath id="mountain-clip">
                <rect x="0" y={60 - (fillPercent / 100) * 60} width="100" height="60" />
              </clipPath>
              {/* Filled area */}
              <path d="M5 55 L50 5 L95 55 Z" fill="var(--color-accent)" opacity="0.2" clipPath="url(#mountain-clip)"
                style={{ transition: 'all 1s ease-out' }} />
              {/* Outline */}
              <path d="M5 55 L50 5 L95 55 Z" stroke="var(--color-border)" strokeWidth="2" strokeLinejoin="round" />
              {/* Inner ridge */}
              <path d="M20 55 L50 20 L80 55" stroke="var(--color-border-subtle)" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <span className="text-xs text-ink-secondary font-medium">
                {stats.daysCovered}/34 days
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Sessions Completed', value: stats.completedCount },
            { label: 'Days Covered', value: `${stats.daysCovered}/34` },
            { label: 'Words Seen', value: stats.wordsSeen },
            { label: 'Total Reviews', value: stats.totalReviews },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-raised rounded-card border border-border p-4">
              <div className="text-xs text-ink-tertiary mb-1">{label}</div>
              <div className="font-serif text-xl text-ink">{value}</div>
            </div>
          ))}
        </div>

        {/* Day map */}
        <div>
          <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">Day Map</h2>
          <DayPickerGrid
            completedDays={stats.completedDays}
            startedDays={stats.startedDays}
            currentDay={null}
            selectedRange={null}
            onDayClick={() => {}}
            onRangeSelect={() => {}}
            mode="library"
          />
        </div>
      </div>
    </div>
  );
}
