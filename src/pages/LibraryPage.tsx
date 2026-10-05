import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck } from '../core/types';
import { FlipCard } from '../components/card/FlipCard';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSwipe } from '../hooks/useSwipe';
import { NavBar } from '../components/layout/NavBar';

interface LibraryPageProps {
  deck: Deck;
}

export function LibraryPage({ deck }: LibraryPageProps) {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);

  const days = Array.from({ length: 34 }, (_, i) => i + 1);

  const dayWords = useMemo(
    () => deck.filter((w) => w.day === selectedDay),
    [deck, selectedDay],
  );

  const currentWord = dayWords[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < dayWords.length - 1) {
      setDirection('next');
      setIsFlipped(false);
      setCurrentIndex((c) => c + 1);
    }
  }, [currentIndex, dayWords.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('prev');
      setIsFlipped(false);
      setCurrentIndex((c) => c - 1);
    }
  }, [currentIndex]);

  const flipCard = useCallback(() => setIsFlipped((f) => !f), []);

  useKeyboard({ onSpace: flipCard, onLeft: handlePrev, onRight: handleNext });

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    onTap: flipCard,
  });

  const selectDay = (day: number) => {
    setSelectedDay(day);
    setCurrentIndex(0);
    setIsFlipped(false);
    setDirection(null);
  };

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <NavBar title="Library" showBack onBack={() => navigate(-1)} />

      {/* Day pills */}
      <div className="shrink-0 border-b border-border overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-2 px-4 py-3 min-w-max">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDay === day
                  ? 'bg-accent text-white dark:text-surface'
                  : 'bg-surface-raised border border-border text-ink-secondary hover:text-ink'
              }`}
              aria-label={`Day ${day}`}
              aria-pressed={selectedDay === day}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentWord ? (
          <FlipCard
            word={currentWord}
            isFlipped={isFlipped}
            status="unrated"
            onFlip={flipCard}
            swipeHandlers={swipeHandlers}
            direction={direction}
          />
        ) : (
          <p className="text-ink-tertiary text-sm">No words for this day.</p>
        )}
      </div>

      {/* Navigation */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-border-subtle">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-border bg-surface-raised disabled:opacity-30 hover:shadow-soft transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span className="text-sm text-ink-secondary font-medium tabular-nums">
          {currentIndex + 1} of {dayWords.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === dayWords.length - 1}
          aria-label="Next card"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-border bg-surface-raised disabled:opacity-30 hover:shadow-soft transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
