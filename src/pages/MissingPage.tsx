import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../core/types';
import { NavBar } from '../components/layout/NavBar';
import { useActiveSession, useSessionEvents, useAllEvents } from '../db/hooks';
import { deriveSessionState } from '../core/session';

interface MissingPageProps {
  deck: Deck;
}

export function MissingPage({ deck }: MissingPageProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'current' | 'all'>('current');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const activeSession = useActiveSession();
  const sessionEvents = useSessionEvents(activeSession?.sessionId);
  const allEvents = useAllEvents();

  // Current session missed cards
  const currentMissed = useMemo(() => {
    if (!activeSession) return [];
    const state = deriveSessionState(activeSession.wordIds, sessionEvents, activeSession.sessionId);
    const missedIds = new Set<number>();
    for (const [id, status] of state.cardStatuses) {
      if (status === 'missed') missedIds.add(id);
    }
    return deck.filter((w) => missedIds.has(w.id));
  }, [activeSession, sessionEvents, deck]);

  // All-time miss counts from event log
  const allTimeMissed = useMemo(() => {
    const counts = new Map<number, number>();
    for (const ev of allEvents) {
      if (ev.result === 'missed') {
        counts.set(ev.wordId, (counts.get(ev.wordId) ?? 0) + 1);
      }
    }
    return deck
      .filter((w) => counts.has(w.id))
      .map((w) => ({ word: w, count: counts.get(w.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [allEvents, deck]);

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <NavBar title="Missed Cards" showBack onBack={() => navigate(-1)} />

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border">
        {(['current', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-accent text-ink' : 'border-transparent text-ink-tertiary'
            }`}
          >
            {t === 'current' ? 'Current Session' : 'All Time'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'current' && (
          <>
            {!activeSession && (
              <div className="h-full flex items-center justify-center text-ink-tertiary text-sm">
                No active session
              </div>
            )}
            {activeSession && currentMissed.length === 0 && (
              <div className="h-full flex items-center justify-center text-ink-tertiary text-sm">
                No missed cards in this session
              </div>
            )}
            {currentMissed.length > 0 && (
              <div className="flex flex-col gap-2">
                {currentMissed.map((word) => (
                  <div key={word.id} className="bg-surface-raised rounded-card border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div>
                        <div className="font-serif text-lg text-ink">{word.word}</div>
                        <div className="text-xs text-ink-tertiary mt-0.5">{word.partOfSpeech}</div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-ink-tertiary transition-transform ${expandedId === word.id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedId === word.id && (
                      <div className="px-4 pb-4 pt-1 border-t border-border-subtle space-y-2">
                        {word.senses.map((sense, i) => (
                          <div key={i} className="text-sm text-ink-secondary">{sense.definition}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'all' && (
          <>
            {allTimeMissed.length === 0 && (
              <div className="h-full flex items-center justify-center text-ink-tertiary text-sm">
                No missed cards recorded yet
              </div>
            )}
            {allTimeMissed.length > 0 && (
              <div className="flex flex-col gap-2">
                {allTimeMissed.map(({ word, count }) => (
                  <div key={word.id} className="bg-surface-raised rounded-card border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div>
                        <div className="font-serif text-lg text-ink">{word.word}</div>
                        <div className="text-xs text-ink-tertiary mt-0.5">{word.partOfSpeech}</div>
                      </div>
                      <span className="text-semantic-red text-sm font-medium shrink-0 ml-4">
                        {count} {count === 1 ? 'miss' : 'misses'}
                      </span>
                    </button>
                    {expandedId === word.id && (
                      <div className="px-4 pb-4 pt-1 border-t border-border-subtle space-y-2">
                        {word.senses.map((sense, i) => (
                          <div key={i} className="text-sm text-ink-secondary">{sense.definition}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
