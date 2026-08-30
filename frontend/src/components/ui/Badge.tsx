import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors';

  const variants = {
    default: 'bg-subtle text-secondary',
    success: 'bg-risk-low/10 text-risk-low',
    warning: 'bg-risk-moderate/10 text-risk-moderate',
    error: 'bg-risk-extreme/10 text-risk-extreme',
    outline: 'border border-default text-tertiary'
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
