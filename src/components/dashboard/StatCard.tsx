import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { CountUp } from '@/components/ui/CountUp'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number
  suffix?: string
  decimals?: number
  hint?: string
  accent?: string
  index?: number
}

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  decimals = 0,
  hint,
  accent = 'bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic',
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.05 }}
      className="rounded-3xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-card dark:border-white/10 dark:bg-brand-900/60"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-400">{label}</p>
          <p className="font-display text-2xl font-extrabold text-brand-900 dark:text-white">
            <CountUp value={value} suffix={suffix} decimals={decimals} />
          </p>
        </div>
      </div>
      {hint && <p className="mt-2 text-[11px] text-brand-400">{hint}</p>}
    </motion.div>
  )
}
