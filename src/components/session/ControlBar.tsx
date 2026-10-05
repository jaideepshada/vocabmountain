import React from 'react';
import type { OrderMode, CardStatus } from '../../core/types';

interface ControlBarProps {
  onMarkGreen: () => void;
  onMarkRed: () => void;
  orderMode: OrderMode;
  onToggleOrder: () => void;
  currentStatus: CardStatus;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onMarkGreen,
  onMarkRed,
  orderMode,
  onToggleOrder,
  currentStatus,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3">
      {/* Top Row: Navigation and Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="w-12 h-12 flex items-center justify-center rounded-button text-ink-secondary bg-surface-raised border border-border shadow-soft disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Previous card"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="inline-flex bg-surface rounded-button p-0.5 border border-border">
          <button
            onClick={onToggleOrder}
            className={`px-4 py-2 text-sm font-medium rounded-button transition-colors ${orderMode === 'series' ? 'bg-surface-raised shadow-soft text-ink' : 'text-ink-tertiary hover:text-ink-secondary'}`}
          >
            Series
          </button>
          <button
            onClick={onToggleOrder}
            className={`px-4 py-2 text-sm font-medium rounded-button transition-colors ${orderMode === 'shuffled' ? 'bg-surface-raised shadow-soft text-ink' : 'text-ink-tertiary hover:text-ink-secondary'}`}
          >
            Shuffled
          </button>
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="w-12 h-12 flex items-center justify-center rounded-button text-ink-secondary bg-surface-raised border border-border shadow-soft disabled:opacity-30 active:scale-95 transition-transform"
          aria-label="Next card"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Row: Mark Actions */}
      <div className="flex gap-3">
        <button
          onClick={onMarkRed}
          aria-label="Mark as missed"
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-button text-sm font-medium shadow-sm active:scale-95 transition-transform border ${
            currentStatus === 'missed' 
              ? 'bg-semantic-red-subtle text-semantic-red border-semantic-red' 
              : 'bg-surface-raised text-ink-secondary border-border'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Missed
        </button>

        <button
          onClick={onMarkGreen}
          aria-label="Mark as memorised"
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-button text-sm font-medium shadow-sm active:scale-95 transition-transform border ${
            currentStatus === 'memorised' 
              ? 'bg-semantic-green-subtle text-semantic-green border-semantic-green' 
              : 'bg-surface-raised text-ink-secondary border-border'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Memorised
        </button>
      </div>
    </div>
  );
};
