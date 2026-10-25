import React from 'react';
import type { Word } from '../../core/types';
import { CardBack } from './CardBack';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardStatus } from '../../core/types';
import { usePronunciation } from '../../hooks/usePronunciation';

interface FlipCardProps {
  word: Word;
  isFlipped: boolean;
  status: CardStatus;
  onFlip: () => void;
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  direction: 'next' | 'prev' | null;
}

export function FlipCard({ word, isFlipped, status, onFlip, swipeHandlers, direction }: FlipCardProps) {
  const { speak, isSpeaking } = usePronunciation();

  const borderClass =
    status === 'memorised'
      ? 'border-semantic-green bg-semantic-green-subtle'
      : status === 'missed'
      ? 'border-semantic-red bg-semantic-red-subtle'
      : 'border-border bg-surface-raised';

  const variants = {
    enter: (dir: 'next' | 'prev' | null) => ({
      x: dir === 'next' ? 80 : dir === 'prev' ? -80 : 0,
      scale: 0.97,
      opacity: 0,
    }),
    center: { x: 0, scale: 1, opacity: 1 },
    exit: (dir: 'next' | 'prev' | null) => ({
      x: dir === 'next' ? -80 : dir === 'prev' ? 80 : 0,
      scale: 0.97,
      opacity: 0,
    }),
  };

  return (
    <div className="perspective-container w-full max-w-lg md:max-w-2xl mx-auto" style={{ height: 'min(60dvh, 600px)' }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={word.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-full touch-none"
          {...swipeHandlers}
        >
          {/* The flip container */}
          <div
            className={`card-flip-inner w-full h-full relative cursor-pointer${isFlipped ? ' flipped' : ''}`}
            onClick={onFlip}
            role="button"
            aria-label={isFlipped ? 'Card back (click to flip)' : 'Card front (click to flip)'}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }}
          >
            {/* Front face */}
            <div
              className={`card-face rounded-card shadow-card border flex flex-col items-center justify-center transition-colors ${borderClass}`}
              style={{ transitionDuration: 'var(--duration-wash)' }}
            >
              {/* Status icon */}
              {status === 'memorised' && (
                <div className="absolute top-4 right-4 text-semantic-green">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {status === 'missed' && (
                <div className="absolute top-4 right-4 text-semantic-red">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <h1
                className="font-serif text-ink text-center px-6 select-none"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                {word.word}
              </h1>

              {/* Speaker button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                aria-label={`Pronounce ${word.word}`}
                className={`mt-5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all select-none shadow-soft
                  ${isSpeaking
                    ? 'border-accent text-accent bg-accent-subtle scale-105'
                    : 'border-border text-ink-secondary hover:border-accent hover:text-accent bg-surface hover:bg-surface-raised'
                  }`}
              >
                {/* Speaker icon */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {isSpeaking ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
                    </>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M11.293 6.293L6 11H3v2h3l5.293 4.707A1 1 0 0013 17V7a1 1 0 00-1.707-.707z" />
                  )}
                </svg>
                <span>{isSpeaking ? 'Speaking…' : 'Pronounce'}</span>
              </button>

              <p className="mt-4 text-xs text-ink-tertiary tracking-widest uppercase select-none">
                tap to reveal
              </p>
            </div>

            {/* Back face */}
            <div
              className={`card-face card-back rounded-card shadow-card border overflow-hidden flex flex-col transition-colors ${borderClass}`}
              style={{ transitionDuration: 'var(--duration-wash)' }}
            >
              <CardBack word={word} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
