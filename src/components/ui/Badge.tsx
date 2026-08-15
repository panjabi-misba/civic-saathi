import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps {
  children: ReactNode
  color?: string
  bg?: string
  dot?: boolean
  className?: string
  pulse?: boolean
}

export function Badge({
  children,
  color,
  bg,
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        className,
      )}
      style={{ color, backgroundColor: bg ?? 'rgba(100,116,139,0.1)' }}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: color }}
            />
          )}
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </span>
      )}
      {children}
    </span>
  )
}
