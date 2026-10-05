import React from 'react';

export const KeyboardHintBar: React.FC = () => {
  return (
    <div className="hidden md:flex hide-on-touch w-full justify-center gap-6 py-2 text-xs text-ink-tertiary bg-surface-overlay backdrop-blur-sm border-t border-border-subtle">
      <div className="flex items-center gap-1.5">
        <kbd className="border border-border rounded px-1.5 py-0.5 text-ink-secondary bg-surface-raised shadow-soft font-sans">Space</kbd>
        <span>Flip</span>
      </div>
      <div className="flex items-center gap-1.5">
        <kbd className="border border-border rounded px-1.5 py-0.5 text-ink-secondary bg-surface-raised shadow-soft font-sans">←</kbd>
        <kbd className="border border-border rounded px-1.5 py-0.5 text-ink-secondary bg-surface-raised shadow-soft font-sans">→</kbd>
        <span>Navigate</span>
      </div>
      <div className="flex items-center gap-1.5">
        <kbd className="border border-border rounded px-1.5 py-0.5 text-ink-secondary bg-surface-raised shadow-soft font-sans uppercase">M</kbd>
        <span>Memorised</span>
      </div>
      <div className="flex items-center gap-1.5">
        <kbd className="border border-border rounded px-1.5 py-0.5 text-ink-secondary bg-surface-raised shadow-soft font-sans uppercase">R</kbd>
        <span>Missed</span>
      </div>
    </div>
  );
};
