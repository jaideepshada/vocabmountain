import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck, SessionScope } from '../core/types';
import { getWordsForDays } from '../core/deck';
import { useStudySession } from '../hooks/useStudySession';
import { useAllSessions } from '../db/hooks';
import { DayPickerGrid } from '../components/shared/DayPickerGrid';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { motion } from 'framer-motion';

interface HomePageProps {
  deck: Deck;
}

function scopeLabel(scope: SessionScope): string {
  if (scope.kind === 'all') return 'All 34 Days';
  if (scope.kind === 'single') return `Day ${scope.startDay}`;
  return `Days ${scope.startDay}–${scope.endDay}`;
}

export function HomePage({ deck }: HomePageProps) {
  const navigate = useNavigate();
  const { session, startSession, endSession, state } = useStudySession(deck);
  const allSessions = useAllSessions();

  // Day picker state
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Compute sets for DayPickerGrid visual state
  const completedDays = useMemo(() => {
    const set = new Set<number>();
    allSessions
      .filter((s) => s.completedAt !== null)
      .forEach((s) => {
        for (let d = s.scope.startDay; d <= s.scope.endDay; d++) set.add(d);
      });
    return set;
  }, [allSessions]);

  const startedDays = useMemo(() => {
    const set = new Set<number>();
    allSessions.forEach((s) => {
      for (let d = s.scope.startDay; d <= s.scope.endDay; d++) set.add(d);
    });
    return set;
  }, [allSessions]);

  const selectedWordCount = useMemo(() => {
    if (!selectedRange) return 0;
    return getWordsForDays(deck, selectedRange.start, selectedRange.end).length;
  }, [deck, selectedRange]);

  const handleBegin = async () => {
    if (!selectedRange) return;
    const scope: SessionScope =
      selectedRange.start === 1 && selectedRange.end === 34
        ? { kind: 'all', startDay: 1, endDay: 34 }
        : selectedRange.start === selectedRange.end
        ? { kind: 'single', startDay: selectedRange.start, endDay: selectedRange.start }
        : { kind: 'range', startDay: selectedRange.start, endDay: selectedRange.end };
    await startSession(scope);
    setShowConfirm(false);
    navigate('/study');
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

  return (
    <motion.div
      className="flex-1 flex flex-col w-full py-8 px-4 relative"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Header */}
      <motion.div variants={item} className="flex flex-col items-center mb-10 text-center">
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="mb-3 text-accent" aria-hidden="true">
          <path d="M1 19L16 2L31 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 19L16 8L25 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        </svg>
        <h1 className="font-serif text-3xl text-ink tracking-tight">Vocab Mountain</h1>
        <p className="text-ink-secondary text-sm mt-1">1,020 words · 34 days</p>
      </motion.div>

      {/* Active session resume card */}
      {session && !state?.isComplete && (
        <motion.div variants={item} className="rounded-card bg-surface-raised shadow-card border border-border p-5 mb-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-ink-tertiary uppercase tracking-wider mb-1">Active session</p>
              <h2 className="font-serif text-xl text-ink">{scopeLabel(session.scope)}</h2>
            </div>
            {state && (
              <div className="text-right">
                <p className="text-2xl font-serif text-ink">{state.greenCount}</p>
                <p className="text-xs text-ink-tertiary">of {state.totalCount} green</p>
              </div>
            )}
          </div>
          {/* Mini progress bar */}
          {state && (
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-semantic-green rounded-full transition-all duration-700"
                style={{ width: `${state.totalCount > 0 ? (state.greenCount / state.totalCount) * 100 : 0}%` }}
              />
            </div>
          )}
          <button
            onClick={() => navigate('/study')}
            className="w-full bg-accent text-white dark:text-surface py-3 rounded-button font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Resume
          </button>
          <button
            onClick={() => endSession()}
            className="w-full mt-2 text-ink-tertiary text-sm py-2 hover:text-ink-secondary transition-colors"
          >
            End Session
          </button>
        </motion.div>
      )}

      {/* New session picker — only shown if no active session */}
      {!session && (
        <motion.div variants={item} className="flex-1 flex flex-col">
          <h2 className="font-serif text-lg text-ink mb-4">Start New Session</h2>
          <DayPickerGrid
            completedDays={completedDays}
            startedDays={startedDays}
            currentDay={null}
            selectedRange={selectedRange}
            onDayClick={() => {}}
            onRangeSelect={(start, end) => setSelectedRange(start === 0 ? null : { start, end })}
            mode="session"
          />
          <button
            onClick={() => selectedRange && setShowConfirm(true)}
            disabled={!selectedRange}
            className="w-full mt-6 bg-accent text-white dark:text-surface py-3 rounded-button font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {selectedRange ? `Start — ${selectedWordCount} cards` : 'Select days to begin'}
          </button>
        </motion.div>
      )}

      {/* Bottom nav links */}
      <motion.div variants={item} className="flex justify-center gap-8 mt-10">
        <button onClick={() => navigate('/library')} className="text-ink-secondary hover:text-ink text-sm font-medium flex items-center gap-1 transition-colors">
          Library <span aria-hidden="true">→</span>
        </button>
        <button onClick={() => navigate('/missing')} className="text-ink-secondary hover:text-ink text-sm font-medium flex items-center gap-1 transition-colors">
          Missed <span aria-hidden="true">→</span>
        </button>
        <button onClick={() => navigate('/progress')} className="text-ink-secondary hover:text-ink text-sm font-medium flex items-center gap-1 transition-colors">
          Progress <span aria-hidden="true">→</span>
        </button>
        <button onClick={() => navigate('/settings')} className="text-ink-secondary hover:text-ink text-sm font-medium flex items-center gap-1 transition-colors">
          Settings <span aria-hidden="true">→</span>
        </button>
      </motion.div>

      {/* Confirmation overlay */}
      {showConfirm && selectedRange && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-surface-raised w-full max-w-sm rounded-card p-6 border border-border shadow-card-hover"
          >
            <h3 className="font-serif text-xl text-ink mb-1">Begin Session</h3>
            <p className="text-ink-secondary text-sm mb-1">
              {selectedRange.start === selectedRange.end
                ? `Day ${selectedRange.start}`
                : `Days ${selectedRange.start}–${selectedRange.end}`}
            </p>
            <p className="text-ink-tertiary text-sm mb-6">{selectedWordCount} cards · scope is fixed once started</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleBegin} className="w-full bg-accent text-white dark:text-surface py-3 rounded-button font-medium text-sm">
                Begin
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full bg-surface text-ink border border-border py-3 rounded-button font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
