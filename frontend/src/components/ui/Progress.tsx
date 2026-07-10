import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={twMerge(clsx("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className))}>
      <div
        className={twMerge(clsx("h-full w-full flex-1 bg-primary transition-all duration-300", indicatorClassName))}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Determine indicator color based on score value
  const strokeColor = value >= 80 
    ? 'stroke-accent-success' 
    : value >= 60 
      ? 'stroke-accent-warning' 
      : 'stroke-accent-danger';

  return (
    <div className={twMerge("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        {/* Track circle */}
        <circle
          className="stroke-muted fill-transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={twMerge("fill-transparent transition-all duration-500 ease-out", strokeColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Content overlays */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight">{value}%</span>
      </div>
    </div>
  );
};
