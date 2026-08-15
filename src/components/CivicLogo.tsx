import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string
  compact?: boolean
  showWordmark?: boolean
  dark?: boolean
}

export function CivicLogo({
  className,
  compact = false,
  showWordmark = true,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-900 shadow-md',
          compact ? 'h-9 w-9' : 'h-10 w-10',
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-5/6 w-5/6" fill="none">
          <path
            d="M12 40 L20 24 L30 33 L42 21 L48 40 Z"
            fill="#10B981"
            stroke="#34D399"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 40 L20 24 L25 34 Z" fill="#34D399" opacity="0.9" />
          <path d="M30 33 L35 46 L42 21 Z" fill="#059669" opacity="0.95" />
          <circle cx="45" cy="25" r="2.4" fill="#F8FAFC" />
          <path
            d="M20 49 h24"
            stroke="#94A3B8"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M24 45 v4 M31 45 v4 M38 45 v4"
            stroke="#E2E8F0"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-civic ring-2 ring-white dark:ring-brand-900" />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight text-brand-900 dark:text-white">
            Civic <span className="text-emerald-civic-deep dark:text-emerald-civic">Saathi</span>
          </span>
          {!compact && (
            <span className="mt-0.5 text-[10px] font-medium tracking-wide text-brand-400">
              CIVIC INTELLIGENCE & ACTION
            </span>
          )}
        </div>
      )}
    </div>
  )
}
