import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 ${className}`}>
      {children}
    </div>
  );
}
