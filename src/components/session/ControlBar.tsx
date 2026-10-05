import React from 'react';
import type { OrderMode, CardStatus } from '../../core/types';

interface ControlBarProps {
  onMarkGreen: () => void;
  onMarkRed: () => void;
  orderMode: OrderMode;
  onToggleOrder: () => void;
  currentStatus: CardStatus;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onMarkGreen,
  onMarkRed,
  orderMode,
  onToggleOrder,
  currentStatus,
}) => {
  return (
    <div className="relative pb-[env(safe-area-inset-bottom,16px)] w-full max-w-lg mx-auto bg-surface-overlay backdrop-blur-xl rounded-t-2xl border-t border-border p-4 flex flex-col gap-4">
      {/* Removed navigation row; handled by swipe and keyboard */}

      {/* Mark Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onMarkRed}
          aria-label="Mark as missed"
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-button text-sm font-medium transition-colors ${
            currentStatus === 'missed' 
              ? 'bg-semantic-red-subtle text-semantic-red' 
              : 'text-ink-secondary hover:bg-surface-raised'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Missed
        </button>

        <div className="mx-2 inline-flex bg-surface rounded-button p-0.5 border border-border">
          <button
            onClick={onToggleOrder}
            className={`px-3 py-1.5 text-sm rounded-button transition-colors ${orderMode === 'series' ? 'bg-surface-raised shadow-soft text-ink' : 'text-ink-tertiary'}`}
          >
            Series
          </button>
          <button
            onClick={onToggleOrder}
            className={`px-3 py-1.5 text-sm rounded-button transition-colors ${orderMode === 'shuffled' ? 'bg-surface-raised shadow-soft text-ink' : 'text-ink-tertiary'}`}
          >
            Shuffled
          </button>
        </div>

        <button
          onClick={onMarkGreen}
          aria-label="Mark as got it"
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-button text-sm font-medium transition-colors ${
            currentStatus === 'memorised' 
              ? 'bg-semantic-green-subtle text-semantic-green border-semantic-green border' 
              : 'text-ink-secondary hover:bg-surface-raised'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Got it
        </button>
      </div>
    </div>
  );
};
