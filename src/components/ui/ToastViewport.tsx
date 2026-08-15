import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import type { ToastItem } from '@/types/civic'
import { cn } from '@/utils/cn'

interface ToastViewportProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-civic" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lift backdrop-blur-xl',
              t.kind === 'success' && 'border-emerald-200/60 bg-white/90 dark:border-emerald-500/25 dark:bg-brand-900/90',
              t.kind === 'error' && 'border-red-200/60 bg-white/90 dark:border-red-500/25 dark:bg-brand-900/90',
              t.kind === 'info' && 'border-sky-200/60 bg-white/90 dark:border-sky-500/25 dark:bg-brand-900/90',
            )}
            role="status"
          >
            <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-900 dark:text-white">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-xs text-brand-500 dark:text-brand-300">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-white/10 dark:hover:text-brand-200"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
