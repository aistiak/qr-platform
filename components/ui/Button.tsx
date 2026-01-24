import React from 'react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-6 py-3 min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  const baseClasses = `rounded-lg font-medium transition-colors ${sizeClasses[size]}`;
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
