import React from 'react';

interface DayPickerGridProps {
  completedDays: ReadonlySet<number>;
  startedDays: ReadonlySet<number>;
  currentDay: number | null;
  selectedRange: { start: number; end: number } | null;
  onDayClick: (day: number) => void;
  onRangeSelect: (start: number, end: number) => void;
  mode: 'session' | 'library';
}

export const DayPickerGrid: React.FC<DayPickerGridProps> = ({
  completedDays,
  startedDays,
  currentDay,
  selectedRange,
  onDayClick,
  onRangeSelect,
  mode,
}) => {
  const days = Array.from({ length: 34 }, (_, i) => i + 1);

  const handleSelectAll = () => {
    onRangeSelect(1, 34);
  };

  const handleClear = () => {
    onRangeSelect(0, 0); // or handle clear in parent
  };

  const getDayStyle = (day: number) => {
    let classes = "min-w-[44px] aspect-square rounded-button flex items-center justify-center text-sm font-medium transition-all hover:shadow-soft hover:scale-105 cursor-pointer ";
    
    const isSelected = selectedRange && day >= selectedRange.start && day <= selectedRange.end;
    
    if (isSelected) {
      classes += "bg-accent-subtle border border-accent text-accent";
    } else if (currentDay === day) {
      classes += "bg-surface-raised border border-border text-ink ring-2 ring-accent";
    } else if (completedDays.has(day)) {
      classes += "bg-semantic-green-subtle border border-semantic-green text-semantic-green";
    } else if (startedDays.has(day)) {
      classes += "bg-surface-raised border border-accent text-accent";
    } else {
      classes += "bg-surface-raised border border-border text-ink";
    }

    return classes;
  };

  const handleDayClick = (day: number) => {
    if (mode === 'session') {
      if (!selectedRange) {
        // Default to cumulative up to the selected day
        onRangeSelect(1, day);
      } else if (selectedRange.start === 1 && selectedRange.end === day) {
        // If they click it again while it's the cumulative range, switch to just that single day
        onRangeSelect(day, day);
      } else if (selectedRange.start === selectedRange.end) {
        // If they had a single day selected, dragging to another day creates a range
        const start = Math.min(selectedRange.start, day);
        const end = Math.max(selectedRange.start, day);
        onRangeSelect(start, end);
      } else {
        // If they had an arbitrary range, clicking a new day starts a new cumulative selection
        onRangeSelect(1, day);
      }
    } else {
      onDayClick(day);
    }
  };

  const getSelectionText = () => {
    if (!selectedRange) return "No days selected";
    if (selectedRange.start === 1 && selectedRange.end === 34) return "All 34 Days";
    if (selectedRange.start === selectedRange.end) return `Day ${selectedRange.start}`;
    return `Days ${selectedRange.start}–${selectedRange.end}`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {mode === 'session' && (
        <div className="flex justify-between items-center px-1">
          <div className="text-sm text-ink-secondary">{getSelectionText()}</div>
          <div className="flex gap-4">
            <button onClick={handleSelectAll} className="text-sm text-accent font-medium">Select All</button>
            <button onClick={handleClear} className="text-sm text-ink-tertiary">Clear</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            className={getDayStyle(day)}
            aria-label={`Day ${day}`}
          >
            {day}
          </button>
        ))}
      </div>

    </div>
  );
};
