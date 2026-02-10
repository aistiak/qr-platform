import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/[0.03] rounded-xl border border-border p-6 ${className}`}>
      {children}
    </div>
  );
}
