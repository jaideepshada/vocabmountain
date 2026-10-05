import React from 'react';

interface ProgressRingProps {
  total: number;
  green: number;
  red: number;
  size?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  total,
  green,
  red,
  size = 48,
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const greenProportion = total > 0 ? green / total : 0;
  const redProportion = total > 0 ? red / total : 0;

  const greenDashoffset = circumference - greenProportion * circumference;
  // Red arc starts after green
  const redDashoffset = circumference - redProportion * circumference;
  const redTransform = `rotate(${-90 + greenProportion * 360} ${size / 2} ${size / 2})`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          stroke="var(--color-border-subtle, #e5e7eb)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Green progress */}
        <circle
          stroke="var(--color-green, #10b981)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={greenDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-600 ease-out"
        />
        {/* Red progress */}
        <circle
          stroke="var(--color-red, #ef4444)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={redDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={redTransform}
          className="transition-all duration-600 ease-out"
        />
      </svg>
      <div className="absolute flex items-center justify-center text-xs font-sans text-ink">
        {green}/{total}
      </div>
    </div>
  );
};
