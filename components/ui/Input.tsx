import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string;
  error?: string;
  id: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-muted mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-2 border rounded-lg bg-white/5 text-foreground placeholder-muted
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          ${error ? 'border-red-500' : 'border-border'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
