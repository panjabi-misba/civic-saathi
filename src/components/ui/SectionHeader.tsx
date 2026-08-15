import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  accent?: string
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  accent = 'text-emerald-civic-deep dark:text-emerald-civic',
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-civic/10 ${accent}`}>{icon}</span>}
        <div>
          <h2 className="font-display text-base font-bold text-brand-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-brand-400">{subtitle}</p>}
        </div>
      </div>
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-civic-deep transition-colors hover:underline dark:text-emerald-civic"
        >
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </div>
  )
}
