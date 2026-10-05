import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../core/types';
import { useStudySession } from '../hooks/useStudySession';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSwipe } from '../hooks/useSwipe';
import { FlipCard } from '../components/card/FlipCard';
import { ControlBar } from '../components/session/ControlBar';
import { ProgressRing } from '../components/session/ProgressRing';
import { CompletionScreen } from '../components/session/CompletionScreen';
import { KeyboardHintBar } from '../components/shared/KeyboardHintBar';
import { ThemeToggle } from '../components/shared/ThemeToggle';

interface StudyPageProps {
  deck: Deck;
}

export function StudyPage({ deck }: StudyPageProps) {
  const navigate = useNavigate();
  const {
    session,
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    state,
    currentCardStatus,
    orderMode,
    flipCard,
    goNext,
    goPrev,
    markMemorise,
    markMissed,
    toggleOrder,
    restartSession,
    replayMissed,
    endSession,
    orderedWordIds,
  } = useStudySession(deck);

  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const wordsMap = useMemo(() => {
    const map = new Map<number, typeof deck[0]>();
    for (const w of deck) map.set(w.id, w);
    return map;
  }, [deck]);

  // Redirect if no active session
  useEffect(() => {
    if (session === null) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNext = useCallback(() => {
    setDirection('next');
    goNext();
  }, [goNext]);

  const handlePrev = useCallback(() => {
    setDirection('prev');
    goPrev();
  }, [goPrev]);

  // Keyboard bindings
  useKeyboard(
    {
      onSpace: flipCard,
      onLeft: handlePrev,
      onRight: handleNext,
      onKeyG: markMemorise,
      onKeyR: markMissed,
    },
    !!session,
  );

  // Touch / swipe handlers
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    onTap: flipCard,
  });

  if (!session) return null;

  // Completion screen
  if (state?.isComplete) {
    return (
      <CompletionScreen
        totalCards={totalCards}
        sessionType={session.sessionType}
        onGoHome={() => navigate('/')}
      />
    );
  }

  // (wordsMap was moved to the top)

  const scopeLbl =
    session.scope.kind === 'all'
      ? 'All Days'
      : session.scope.kind === 'single'
      ? `Day ${session.scope.startDay}`
      : `Days ${session.scope.startDay}–${session.scope.endDay}`;

  const hasMissed = (state?.redCount ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border-subtle">
        <button
          onClick={() => navigate('/')}
          className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
          aria-label="Back to home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">{scopeLbl}</span>
          {state && (
            <ProgressRing
              total={state.totalCount}
              green={state.greenCount}
              red={state.redCount}
              size={40}
            />
          )}
        </div>

        {/* Menu and Theme Toggle */}
        <div className="flex items-center gap-1" ref={menuRef}>
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
              aria-label="Session menu"
              aria-expanded={isMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" fill="currentColor" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="12" cy="19" r="1" fill="currentColor" />
              </svg>
            </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-surface-raised rounded-button shadow-card-hover border border-border z-20 py-1 overflow-hidden">
              <button
                onClick={() => { restartSession(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
              >
                Restart Session
              </button>
              <button
                onClick={() => { if (hasMissed) { replayMissed(); setIsMenuOpen(false); } }}
                disabled={!hasMissed}
                className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Replay Missed
              </button>
              <div className="h-px bg-border mx-2 my-1" />
              <button
                onClick={() => { endSession(); setIsMenuOpen(false); navigate('/'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-semantic-red hover:bg-surface transition-colors"
              >
                End Session
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Progress text */}
      <div className="text-center pt-3 shrink-0">
        <span className="text-xs text-ink-tertiary tabular-nums">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="min-h-full flex flex-col">
          {/* Card Area (Centered vertically in the initial viewport) */}
          <div className="flex-1 flex items-center justify-center p-4 shrink-0" style={{ minHeight: 'calc(100dvh - 16rem)' }}>
            {currentCard ? (
              <FlipCard
                word={currentCard}
                isFlipped={isFlipped}
                status={currentCardStatus}
                onFlip={flipCard}
                swipeHandlers={swipeHandlers}
                direction={direction}
              />
            ) : (
              <div className="text-ink-tertiary text-sm">Loading…</div>
            )}
          </div>

          {/* Session Words Overview */}
          <div className="w-full max-w-2xl mx-auto px-4 pb-8 shrink-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-border-subtle" />
              <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-widest">
                Session Words
              </h3>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
              {orderedWordIds.map((id, index) => {
                const word = wordsMap.get(id);
                if (!word) return null;
                
                const status = state?.cardStatuses.get(id) || 'unrated';
                const isCurrent = index === currentIndex;

                let statusClass = "bg-surface border-border text-ink-secondary";
                if (status === 'memorised') {
                  statusClass = "bg-semantic-green-subtle border-semantic-green text-semantic-green";
                } else if (status === 'missed') {
                  statusClass = "bg-semantic-red-subtle border-semantic-red text-semantic-red";
                }

                return (
                  <div
                    key={`${id}-${index}`}
                    className={`px-3 py-2.5 text-sm font-medium rounded-button border transition-colors flex items-center justify-center text-center ${statusClass} ${
                      isCurrent ? 'ring-2 ring-accent shadow-soft z-10' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    {word.word}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0">
        <KeyboardHintBar />
        <ControlBar
          onMarkGreen={markMemorise}
          onMarkRed={markMissed}
          orderMode={orderMode}
          onToggleOrder={toggleOrder}
          currentStatus={currentCardStatus}
        />
      </div>
    </div>
  );
}
