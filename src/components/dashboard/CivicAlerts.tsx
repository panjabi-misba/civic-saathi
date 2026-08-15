import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Megaphone, Info, X } from 'lucide-react'
import type { CivicAlert } from '@/types/civic'
import { cn } from '@/utils/cn'

const ALERT_STYLES: Record<CivicAlert['kind'], { icon: typeof AlertTriangle; chip: string; bar: string }> = {
  priority: {
    icon: AlertTriangle,
    chip: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  resolved: {
    icon: CheckCircle2,
    chip: 'bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic',
    bar: 'bg-emerald-civic',
  },
  community: {
    icon: Megaphone,
    chip: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
    bar: 'bg-violet-500',
  },
  info: {
    icon: Info,
    chip: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
    bar: 'bg-sky-500',
  },
}

interface CivicAlertsProps {
  alerts: CivicAlert[]
  visible: boolean
  onDismiss: (id: string) => void
}

export function CivicAlerts({ alerts, visible, onDismiss }: CivicAlertsProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <div className="space-y-2.5">
          {alerts.map((alert, i) => {
            const style = ALERT_STYLES[alert.kind]
            const Icon = style.icon
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-brand-100 bg-white/90 py-3 pl-4 pr-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-brand-900/80"
              >
                <div className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', style.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-brand-900 dark:text-white">{alert.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-brand-500 dark:text-brand-300">
                    {alert.message}
                  </p>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}
