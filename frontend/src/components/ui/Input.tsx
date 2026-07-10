import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, className, ...props }) => {
  return (
    <label className={twMerge(clsx("text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", className))} {...props}>
      {children}
    </label>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  return (
    <input
      className={twMerge(
        clsx(
          "flex w-full rounded-lg border border-border bg-card-light dark:bg-card-dark px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 dark:border-white/5",
          className
        )
      )}
      {...props}
    />
  );
};

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  return (
    <textarea
      className={twMerge(
        clsx(
          "flex w-full rounded-lg border border-border bg-card-light dark:bg-card-dark px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[80px] dark:border-white/5",
          className
        )
      )}
      {...props}
    />
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ className, options, ...props }) => {
  return (
    <select
      className={twMerge(
        clsx(
          "flex w-full rounded-lg border border-border bg-card-light dark:bg-card-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 dark:border-white/5",
          className
        )
      )}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-card-light dark:bg-[#111827]">
          {opt.label}
        </option>
      ))}
    </select>
  );
};
