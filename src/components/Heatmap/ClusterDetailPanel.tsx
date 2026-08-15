import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  Minus,
  Radio,
  Trash2,
  Lightbulb,
  CircleDot,
  Droplets,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { HeatmapCluster } from '@/data/heatmapData'
import { SIGNAL_META } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface ClusterDetailPanelProps {
  t: (key: string) => string
  cluster: HeatmapCluster | null
  onFocus: () => void
}

const SEVERITY_META = {
  high: { label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  medium: { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  low: { label: 'Low', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
} as const

const ICONS = { garbage: Trash2, streetlight: Lightbulb, pothole: CircleDot, water: Droplets } as const

export function ClusterDetailPanel({ t, cluster, onFocus }: ClusterDetailPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-white/10 dark:bg-brand-900">
      <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3 dark:border-white/10">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
          <Radio className="h-3.5 w-3.5 text-emerald-civic" />
          {t('heatmap.selected')}
        </p>
        <AnimatePresence>
          {cluster && (
            <motion.span
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-civic/10 px-2 py-0.5 text-[10px] font-bold text-emerald-civic-deep dark:text-emerald-civic"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-civic" />
              {t('heatmap.live')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {cluster ? (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SIGNAL_META[cluster.signal].color}1a`,
                  color: SIGNAL_META[cluster.signal].color,
                }}
              >
                {(() => {
                  const Icon = ICONS[cluster.signal]
                  return <Icon className="h-5 w-5" />
                })()}
              </span>
              <div className="min-w-0">
                <h4 className="font-display text-sm font-bold leading-snug text-brand-900 dark:text-white">
                  {cluster.name}
                </h4>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-brand-400">
                  <MapPin className="h-3 w-3" />
                  {cluster.area}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-2.5 text-center dark:border-white/8 dark:bg-white/4">
                <p className="font-display text-lg font-extrabold text-brand-900 dark:text-white">
                  {cluster.reports}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-400">
                  {t('heatmap.reportsLabel')}
                </p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-2.5 text-center dark:border-white/8 dark:bg-white/4">
                <p className="flex items-center justify-center gap-1 font-display text-lg font-extrabold text-emerald-civic-deep dark:text-emerald-civic">
                  <Users className="h-3.5 w-3.5" />
                  {cluster.neighbours}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-400">
                  {t('heatmap.neighbours')}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl p-2.5 text-center"
                style={{ backgroundColor: SEVERITY_META[cluster.severity].bg }}
              >
                <p
                  className="font-display text-sm font-extrabold"
                  style={{ color: SEVERITY_META[cluster.severity].color }}
                >
                  {SEVERITY_META[cluster.severity].label}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-400">
                  {t('heatmap.severity')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2.5 dark:border-white/8">
              <span className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-200">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                {t('heatmap.trend')}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-bold',
                  cluster.trend === 'rising' && 'text-red-500',
                  cluster.trend === 'falling' && 'text-emerald-civic',
                  cluster.trend === 'steady' && 'text-brand-400',
                )}
              >
                {cluster.trend === 'rising' && <ArrowUpRight className="h-3.5 w-3.5" />}
                {cluster.trend === 'falling' && <ArrowDownRight className="h-3.5 w-3.5" />}
                {cluster.trend === 'steady' && <Minus className="h-3.5 w-3.5" />}
                {t(`heatmap.trend.${cluster.trend}`)}
              </span>
            </div>

            <p className="text-[11px] text-brand-400">
              {t('heatmap.lastSeen')}:{' '}
              <span className="font-semibold text-brand-600 dark:text-brand-200">{cluster.lastSeen}</span>
            </p>

            <button
              onClick={onFocus}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 py-2.5 text-sm font-semibold text-emerald-civic-deep transition-colors hover:bg-emerald-civic/15 dark:text-emerald-civic"
            >
              <MapPin className="h-4 w-4" />
              {t('heatmap.focusOnMap')}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 p-6 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100/70 text-brand-400 dark:bg-white/8">
              <Radio className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">
              {t('heatmap.noSelection')}
            </p>
            <p className="text-xs text-brand-400">{t('heatmap.selectHint')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
