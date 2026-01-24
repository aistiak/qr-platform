import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`p-4 bg-red-900 border border-red-700 rounded-lg text-red-300 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
