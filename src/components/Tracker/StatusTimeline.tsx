import { motion } from 'framer-motion'
import { Check, Circle, Loader2, Zap } from 'lucide-react'
import type { ComplaintStatus } from '@/types/civic'
import { STATUS_ORDER } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface StatusTimelineProps {
  status: ComplaintStatus
  compact?: boolean
}

export function StatusTimeline({ status, compact = false }: StatusTimelineProps) {
  const activeIndex =
    status === 'Citizen Disputed' ? STATUS_ORDER.indexOf('Resolved') : STATUS_ORDER.indexOf(status)
  const shown = compact ? STATUS_ORDER.slice(0, 4) : STATUS_ORDER

  return (
    <ol
      className={cn('flex items-center', compact ? 'gap-1' : 'gap-0')}
      aria-label="Complaint status pipeline"
    >
      {shown.map((step, i) => {
        const isDone = i < activeIndex
        const isActive = i === activeIndex
        const isLast = i === shown.length - 1

        return (
          <li key={step} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center">
              <motion.span
                initial={false}
                animate={{ scale: 1 }}
                className={cn(
                  'flex items-center justify-center rounded-full border-2 transition-colors',
                  compact ? 'h-5 w-5' : 'h-7 w-7',
                  isDone && 'border-emerald-civic bg-emerald-civic text-white',
                  isActive && 'border-amber-500 bg-amber-500/15 text-amber-500',
                  !isDone && !isActive && 'border-brand-200 bg-white text-brand-300 dark:border-white/15 dark:bg-white/5 dark:text-brand-500',
                )}
              >
                {isDone ? (
                  <Check className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={3} />
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                  </motion.div>
                ) : (
                  <Circle className={compact ? 'h-2 w-2' : 'h-2.5 w-2.5'} fill="currentColor" />
                )}
              </motion.span>
              {!compact && (
                <span
                  className={cn(
                    'mt-1.5 hidden text-[10px] font-semibold sm:block',
                    isActive ? 'text-amber-600 dark:text-amber-400' : isDone ? 'text-emerald-civic-deep dark:text-emerald-civic' : 'text-brand-400',
                  )}
                >
                  {step === 'AI Verified' ? (
                    <span className="flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5" />
                      {step}
                    </span>
                  ) : (
                    step
                  )}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors',
                  compact ? 'mx-1' : 'mx-1.5',
                  i < activeIndex ? 'bg-emerald-civic' : 'bg-brand-200 dark:bg-white/12',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
