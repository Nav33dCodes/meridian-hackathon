import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-1 focus:ring-offset-base disabled:opacity-40 disabled:pointer-events-none rounded-lg';
  
  const variants = {
    primary: 'bg-accent text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_4px_16px_rgba(94,106,210,0.4)] hover:brightness-110',
    secondary: 'bg-subtle text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_2px_4px_rgba(0,0,0,0.2)] hover:bg-elevated hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_2px_8px_rgba(0,0,0,0.3)]',
    outline: 'bg-transparent border border-subtle text-primary hover:border-accent/50 hover:bg-accent/5',
    ghost: 'bg-transparent text-secondary hover:text-primary hover:bg-subtle'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
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
