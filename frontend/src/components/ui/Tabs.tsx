import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  // Pass state variables down to tabs sub-components via cloneElement or context
  return (
    <div className={twMerge(clsx("w-full", className))}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string; activeValue?: string; onValueChange?: (v: string) => void }> = ({
  children,
  className,
  activeValue,
  onValueChange
}) => {
  return (
    <div className={twMerge(clsx("inline-flex items-center justify-center rounded-lg bg-secondary p-1 text-muted-foreground", className))}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string; activeValue?: string; onValueChange?: (v: string) => void }> = ({
  value,
  children,
  className,
  activeValue,
  onValueChange
}) => {
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => onValueChange?.(value)}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          isActive 
            ? "bg-card-light dark:bg-card-dark text-foreground shadow-sm font-semibold" 
            : "hover:bg-muted/50 hover:text-foreground"
        ),
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string; activeValue?: string }> = ({
  value,
  children,
  className,
  activeValue
}) => {
  if (activeValue !== value) return null;
  return (
    <div className={twMerge(clsx("mt-4 focus-visible:outline-none", className))}>
      {children}
    </div>
  );
};
