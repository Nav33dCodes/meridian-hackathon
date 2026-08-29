import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md', ...props }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`bg-elevated border border-subtle rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] overflow-hidden ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
