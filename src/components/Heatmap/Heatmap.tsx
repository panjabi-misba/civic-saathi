import { motion } from 'framer-motion'
import { Activity, Layers, Map as MapIcon, Radar, Compass } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { HeatmapSignal } from '@/data/heatmapData'
import {
  INITIAL_CLUSTERS,
  signalCount,
  totalNeighbours,
  totalReports,
} from '@/data/heatmapData'
import { SIGNAL_META } from '@/data/mockData'
import type { ThemeMode } from '@/types/civic'
import { CityMap } from '@/components/Heatmap/CityMap'
import { MockCityMap } from '@/components/Heatmap/MockCityMap'
import { CommunitySignalCounter } from '@/components/Heatmap/CommunitySignalCounter'
import { ClusterDetailPanel } from '@/components/Heatmap/ClusterDetailPanel'
import { cn } from '@/utils/cn'

interface HeatmapProps {
  t: (key: string) => string
  theme: ThemeMode
}

type MapMode = 'live' | 'mock'

export function Heatmap({ t, theme }: HeatmapProps) {
  const [mode, setMode] = useState<MapMode>('live')
  const [activeSignal, setActiveSignal] = useState<HeatmapSignal | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mapSectionRef = useRef<HTMLElement>(null)

  const focusOnMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const selected = useMemo(
    () => INITIAL_CLUSTERS.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  )

  const stats = useMemo(
    () =>
      (Object.keys(signalCount(INITIAL_CLUSTERS)) as HeatmapSignal[]).map((signal) => ({
        signal,
        count: signalCount(INITIAL_CLUSTERS)[signal],
        reports: INITIAL_CLUSTERS.filter((c) => c.signal === signal).reduce(
          (sum, c) => sum + c.reports,
          0,
        ),
      })),
    [],
  )

  const legend = useMemo(
    () =>
      (Object.keys(SIGNAL_META) as HeatmapSignal[]).map((s) => ({
        signal: s,
        ...SIGNAL_META[s],
      })),
    [],
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-civic/20 bg-emerald-civic/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-civic-deep dark:text-emerald-civic">
          <Radar className="h-3.5 w-3.5" />
          {t('heatmap.title')} · Mumbai
        </span>
        <h1 className="mt-4 flex items-center gap-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          <span className="text-gradient-civic">{t('heatmap.title')}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-brand-500 dark:text-brand-300">
          {t('heatmap.sub')}
        </p>
        <p className="mt-1 text-sm text-brand-400">{t('heatmap.exploring')}</p>
      </motion.div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <CommunitySignalCounter
            t={t}
            stats={stats}
            totalReports={totalReports(INITIAL_CLUSTERS)}
            totalNeighbours={totalNeighbours(INITIAL_CLUSTERS)}
            activeSignal={activeSignal}
            onSelect={setActiveSignal}
          />

          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-900">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
              <Compass className="h-3.5 w-3.5" />
              {t('heatmap.legend')}
            </p>
            <div className="flex flex-wrap gap-2">
              {legend.map((item) => (
                <span
                  key={item.signal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <ClusterDetailPanel t={t} cluster={selected} onFocus={focusOnMap} />
        </motion.aside>

        <motion.section
          ref={mapSectionRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="min-w-0"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-brand-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
              <button
                onClick={() => setMode('live')}
                aria-pressed={mode === 'live'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  mode === 'live'
                    ? 'bg-brand-900 text-white shadow-sm dark:bg-white dark:text-brand-900'
                    : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
                )}
              >
                <MapIcon className="h-3.5 w-3.5" />
                {t('heatmap.liveMap')}
              </button>
              <button
                onClick={() => setMode('mock')}
                aria-pressed={mode === 'mock'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  mode === 'mock'
                    ? 'bg-brand-900 text-white shadow-sm dark:bg-white dark:text-brand-900'
                    : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                {t('heatmap.mockMap')}
              </button>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-400">
              <Activity className="h-3.5 w-3.5 text-emerald-civic" />
              {activeSignal === 'all'
                ? t('heatmap.allHotspots')
                : `${SIGNAL_META[activeSignal].label}: ${
                    INITIAL_CLUSTERS.filter((c) => c.signal === activeSignal).length
                  }`}
            </p>
          </div>

          {mode === 'live' ? (
            <CityMap
              t={t}
              clusters={INITIAL_CLUSTERS}
              activeSignal={activeSignal}
              selectedId={selectedId}
              theme={theme}
              onSelect={(c) => setSelectedId(c.id)}
            />
          ) : (
            <MockCityMap
              t={t}
              clusters={INITIAL_CLUSTERS}
              activeSignal={activeSignal}
              selectedId={selectedId}
              onSelect={(c) => setSelectedId(c.id)}
              className="h-[420px] lg:h-[560px]"
            />
          )}
        </motion.section>
      </div>
    </div>
  )
}
