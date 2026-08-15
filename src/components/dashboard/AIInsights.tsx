import { motion } from 'framer-motion'
import { BrainCircuit, TrendingUp, TrendingDown, Lightbulb, Info } from 'lucide-react'
import type { CivicInsight } from '@/types/civic'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/utils/cn'

interface AIInsightsProps {
  t: (key: string) => string
  insights: CivicInsight[]
  onAsk?: (question: string) => void
}

const toneStyles = {
  warn: {
    icon: TrendingUp,
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  good: {
    icon: TrendingDown,
    chip: 'bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic',
    bar: 'bg-emerald-civic',
  },
  info: {
    icon: Info,
    chip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    bar: 'bg-sky-500',
  },
}

export function AIInsights({ t, insights, onAsk }: AIInsightsProps) {
  return (
    <div>
      <SectionHeader
        icon={<BrainCircuit className="h-4 w-4" />}
        title={t('dashboard.aiInsights')}
        subtitle="Civic Saathi AI"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => {
          const style = toneStyles[insight.tone]
          const Icon = style.icon
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-card dark:border-white/10 dark:bg-brand-900/60"
            >
              <div className={cn('absolute inset-x-0 top-0 h-1', style.bar)} />
              <div className="flex items-center justify-between gap-2">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', style.chip)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-display text-2xl font-extrabold text-brand-900 dark:text-white">
                  {insight.delta !== 0 && (
                    <span className={insight.delta > 0 ? 'text-amber-500' : 'text-emerald-civic'}>
                      {insight.delta > 0 ? '+' : '−'}{Math.abs(insight.delta)}%
                    </span>
                  )}
                </span>
              </div>
              <h4 className="mt-3 font-display text-sm font-bold text-brand-900 dark:text-white">
                {insight.title}
              </h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-brand-500 dark:text-brand-300">
                {insight.body}
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50/70 px-3 py-2.5 dark:bg-white/4">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p className="text-[11px] leading-relaxed text-brand-600 dark:text-brand-200">
                  {insight.recommendation}
                </p>
              </div>
              {onAsk && (
                <button
                  onClick={() => onAsk(insight.title)}
                  className="mt-3 text-[11px] font-bold text-emerald-civic-deep underline-offset-2 hover:underline dark:text-emerald-civic"
                >
                  {t('quick.chat')} →
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
