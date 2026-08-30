import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-40 disabled:pointer-events-none rounded-full';

  const variants = {
    primary: 'bg-accent text-white border border-transparent hover:bg-[var(--accent-hover)] shadow-token-sm',
    secondary: 'bg-accent-muted text-accent-on-container border border-transparent hover:bg-accent-border/25',
    ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-subtle'
  };

  const sizes = {
    sm: 'h-8 px-3.5 text-xs',
    md: 'h-9 px-4.5 text-sm',
    lg: 'h-10 px-5 text-sm'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
