import { motion } from 'framer-motion'
import { Equal, Plus, Sigma } from 'lucide-react'
import type { Severity, SeverityBreakdownFactor } from '@/types/civic'
import { SEVERITY_META } from '@/data/mockData'

interface SeverityBreakdownProps {
  t: (key: string) => string
  breakdown: SeverityBreakdownFactor[]
  score: number
  level: Severity
}

export function SeverityBreakdown({ t, breakdown, score, level }: SeverityBreakdownProps) {
  const meta = SEVERITY_META[level] ?? SEVERITY_META.Medium
  const display = breakdown.length > 0 ? breakdown : [{ factor: 'Baseline severity', impact: score }]
  const total = display.reduce((s, f) => s + Math.max(0, f.impact), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
      className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
    >
      <div className="border-b border-brand-100 px-5 py-4 dark:border-white/8">
        <div className="flex items-center gap-2">
          <Sigma className="h-4 w-4 text-brand-400" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-900 dark:text-white">
            {t('vision.breakdownTitle')}
          </h3>
        </div>
        <p className="mt-1 text-[11px] text-brand-400">{t('vision.breakdownSub')}</p>
      </div>

      <div className="space-y-2.5 p-5">
        {display.map((f) => {
          const pct = total > 0 ? Math.min(100, Math.round((Math.max(0, f.impact) / total) * 100)) : 0
          return (
            <div key={f.factor} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-brand-600 dark:text-brand-200">
                    {f.factor}
                  </span>
                  <span className="shrink-0 font-display font-bold text-brand-900 dark:text-white">
                    +{Math.max(0, f.impact)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-civic"
                  />
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 dark:text-brand-300">
            <Plus className="h-3.5 w-3.5" />
            {t('vision.breakdownFactors')}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Equal className="h-3.5 w-3.5 text-brand-400" />
            <span className="font-display text-lg font-extrabold" style={{ color: meta.color }}>
              {score}
              <span className="text-xs font-semibold text-brand-400"> / 100</span>
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {level}
            </span>
          </span>
        </div>

        <p className="text-center text-[10px] text-brand-400">{t('vision.breakdownNote')}</p>
      </div>
    </motion.div>
  )
}
