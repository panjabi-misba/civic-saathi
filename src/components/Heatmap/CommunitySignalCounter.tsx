import { motion } from 'framer-motion'
import { Trash2, Lightbulb, CircleDot, Droplets, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { HeatmapSignal } from '@/data/heatmapData'
import { SIGNAL_META } from '@/data/mockData'

interface SignalStat {
  signal: HeatmapSignal
  count: number
  reports: number
}

interface CommunitySignalCounterProps {
  t: (key: string) => string
  stats: SignalStat[]
  totalReports: number
  totalNeighbours: number
  activeSignal: HeatmapSignal | 'all'
  onSelect: (signal: HeatmapSignal | 'all') => void
}

const ICONS: Record<HeatmapSignal, typeof Trash2> = {
  garbage: Trash2,
  streetlight: Lightbulb,
  pothole: CircleDot,
  water: Droplets,
}

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, duration])

  return value
}

export function CommunitySignalCounter({
  t,
  stats,
  totalReports,
  totalNeighbours,
  activeSignal,
  onSelect,
}: CommunitySignalCounterProps) {
  const animatedTotal = useCountUp(totalReports)
  const animatedNeighbours = useCountUp(totalNeighbours)

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-900"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-civic" />
            {t('heatmap.liveReports')}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-brand-900 dark:text-white">
            {animatedTotal.toLocaleString('en-IN')}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-900"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
            <Users className="h-3.5 w-3.5" />
            {t('heatmap.neighbours')}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-emerald-civic-deep dark:text-emerald-civic">
            {animatedNeighbours.toLocaleString('en-IN')}
          </p>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-brand-900">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
          {t('heatmap.signalCounts')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelect('all')}
            aria-pressed={activeSignal === 'all'}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
              activeSignal === 'all'
                ? 'border-brand-900 bg-brand-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-brand-900'
                : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5 dark:text-brand-200 dark:hover:bg-white/10'
            }`}
          >
            <span className="text-lg font-extrabold">{t('heatmap.all')}</span>
            <span className="ml-auto text-[11px] font-semibold opacity-70">
              {stats.reduce((s, x) => s + x.count, 0)}
            </span>
          </button>

          {stats.map((stat, i) => {
            const Icon = ICONS[stat.signal]
            const meta = SIGNAL_META[stat.signal]
            const active = activeSignal === stat.signal
            return (
              <motion.button
                key={stat.signal}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
                onClick={() => onSelect(active ? 'all' : stat.signal)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                  active
                    ? 'border-brand-900 bg-brand-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-brand-900'
                    : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5 dark:text-brand-200 dark:hover:bg-white/10'
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.15)' : `${meta.color}1a`,
                    color: active ? meta.color : meta.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold leading-tight">
                    {meta.label}
                  </span>
                  <span className="block text-[10px] font-medium opacity-60">
                    {stat.reports} {t('heatmap.reportsLabel')}
                  </span>
                </span>
                <span className="ml-auto font-display text-base font-extrabold">{stat.count}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
