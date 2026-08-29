import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold rounded-full transition-colors';
  
  const variants = {
    default: 'bg-subtle text-secondary border border-subtle',
    success: 'bg-risk-low/10 text-risk-low border border-risk-low/20',
    warning: 'bg-risk-moderate/10 text-risk-moderate border border-risk-moderate/20',
    error: 'bg-risk-extreme/10 text-risk-extreme border border-risk-extreme/20',
    outline: 'border border-subtle text-tertiary'
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
