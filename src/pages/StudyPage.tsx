import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../core/types';
import { useStudySession } from '../hooks/useStudySession';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSwipe } from '../hooks/useSwipe';
import { FlipCard } from '../components/card/FlipCard';
import { ControlBar } from '../components/session/ControlBar';
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
      onKeyM: markMemorise,
      onKeyR: markMissed,
    },
    !!session,
  );

  // Touch / swipe handlers
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
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
    <div className="w-full flex flex-col">
      {/* Primary viewport: Exactly 100dvh minus safe area */}
      <div className="flex flex-col min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] shrink-0">
        
        {/* Top Navbar */}
        <div className="flex items-center h-14 px-2 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 flex items-center justify-center text-ink-secondary hover:bg-surface-raised rounded-button transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-ink">
              {scopeLbl}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-11 h-11 flex items-center justify-center text-ink-secondary hover:bg-surface-raised rounded-button transition-colors"
                aria-label="Session options"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
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

        {/* Progress Counter */}
        <div className="text-center pt-2 pb-2 shrink-0">
          <span className="text-xs text-ink-tertiary tabular-nums">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>

        {/* Main Content Area (Card + Controls) */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full p-4">
          {/* Card */}
          <div className="w-full flex flex-col items-center justify-center max-w-lg md:max-w-2xl flex-1 md:flex-none">
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
              <div className="text-ink-tertiary text-sm m-auto">Loading…</div>
            )}
          </div>

          {/* Unified Controls */}
          <div className="w-full max-w-lg md:max-w-2xl shrink-0 mt-6 md:mt-8">
            <KeyboardHintBar />
            <ControlBar
              onMarkGreen={markMemorise}
              onMarkRed={markMissed}
              orderMode={orderMode}
              onToggleOrder={toggleOrder}
              currentStatus={currentCardStatus}
              onPrev={handlePrev}
              onNext={handleNext}
              canGoPrev={currentIndex > 0}
              canGoNext={currentIndex < totalCards - 1}
            />
          </div>
        </div>
      </div>

      {/* Below the Fold: Session Words */}
      <div className="w-full max-w-2xl mx-auto px-4 pb-12 pt-8 shrink-0 border-t border-border-subtle mt-4">
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
  );
}
