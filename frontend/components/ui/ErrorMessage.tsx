import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-300 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
