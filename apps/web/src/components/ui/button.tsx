'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        'bg-foreground text-background hover:bg-foreground/90 shadow-sm',
      outline:
        'border border-border bg-transparent hover:bg-muted text-foreground',
      ghost: 'bg-transparent hover:bg-muted text-foreground',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
