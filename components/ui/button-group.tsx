'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function ButtonGroup({
  className,
  orientation = 'horizontal',
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex p-0.5 rounded-xl bg-muted/60 border shadow-2xs',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function ButtonGroupItem({
  className,
  active,
  children,
  ...props
}: ButtonGroupItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none active:scale-[0.98]',
        active
          ? 'bg-primary text-primary-foreground shadow-xs font-bold'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
