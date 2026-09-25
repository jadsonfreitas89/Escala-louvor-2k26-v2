import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'highlight';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-zinc-900/90 border border-zinc-800/80',
    elevated: 'bg-zinc-900 border border-zinc-800 shadow-lg shadow-black/40',
    glass: 'bg-zinc-900/60 backdrop-blur-md border border-zinc-800/60',
    highlight: 'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/30'
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-200 hover:border-zinc-700 hover:shadow-md hover:shadow-black/30 hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
