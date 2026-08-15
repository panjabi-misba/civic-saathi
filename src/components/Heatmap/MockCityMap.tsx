import { motion } from 'framer-motion'
import type { HeatmapCluster, HeatmapSignal } from '@/data/heatmapData'
import { MUMBAI_BOUNDS } from '@/data/heatmapData'
import { SIGNAL_META } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface MockCityMapProps {
  t: (key: string) => string
  clusters: HeatmapCluster[]
  activeSignal: HeatmapSignal | 'all'
  selectedId: string | null
  onSelect: (cluster: HeatmapCluster) => void
  className?: string
}

const W = 800
const H = 640

const SIGNAL_SIZE: Record<HeatmapSignal, number> = {
  garbage: 10,
  streetlight: 9,
  pothole: 10,
  water: 11,
}

function project(lat: number, lng: number): { x: number; y: number } {
  const { north, south, west, east } = MUMBAI_BOUNDS
  const x = ((lng - west) / (east - west)) * W
  const y = ((north - lat) / (north - south)) * H
  return { x, y }
}

export function MockCityMap({
  t,
  clusters,
  activeSignal,
  selectedId,
  onSelect,
  className,
}: MockCityMapProps) {
  const visible = activeSignal === 'all' ? clusters : clusters.filter((c) => c.signal === activeSignal)

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-brand-100 dark:border-white/10', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label="Mumbai community signal map">
        <defs>
          <linearGradient id="mock-sea" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#2d5a8a" />
          </linearGradient>
          <radialGradient id="mock-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <pattern id="mock-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={W} height={H} className="fill-slate-100 dark:fill-brand-950" />

        <path
          d="M0 0 H60 C90 120 70 240 95 320 C120 400 80 520 110 640 H0 Z"
          fill="url(#mock-sea)"
          opacity="0.9"
        />
        <path
          d="M60 0 C90 120 70 240 95 320 C120 400 80 520 110 640"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="3"
        />
        <path
          d="M120 0 C150 160 140 320 165 480 C175 560 160 620 170 640"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
        />

        <rect x="0" y="0" width={W} height={H} fill="url(#mock-grid)" className="text-slate-400 dark:text-white" />

        <path
          d="M0 180 H800 M0 360 H800 M0 540 H800"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          fill="none"
        />
        <path
          d="M200 0 V640 M400 0 V640 M600 0 V640"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          fill="none"
        />

        {clusters.map((c) => {
          const { x, y } = project(c.lat, c.lng)
          const size = SIGNAL_SIZE[c.signal]
          const heat = c.severity === 'high' ? 3 : c.severity === 'medium' ? 2 : 1.4
          const selected = selectedId === c.id
          const hidden = activeSignal !== 'all' && c.signal !== activeSignal
          return (
            <g key={c.id} opacity={hidden ? 0.12 : 1} className="transition-opacity duration-300">
              <circle cx={x} cy={y} r={size * 4.4 * heat} fill="url(#mock-glow)" opacity={hidden ? 0 : 0.85} />
              <circle cx={x} cy={y} r={size} fill={SIGNAL_META[c.signal].color} opacity="0.18" />
              <circle
                cx={x}
                cy={y}
                r={size * 0.92}
                fill={SIGNAL_META[c.signal].color}
                stroke={selected ? '#ffffff' : SIGNAL_META[c.signal].color}
                strokeWidth={selected ? 3 : 1}
              />
              <motion.circle
                cx={x}
                cy={y}
                r={size}
                fill="none"
                stroke={SIGNAL_META[c.signal].color}
                strokeWidth="2"
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-wrap content-end items-end justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          {visible.map((c) => {
            const { x, y } = project(c.lat, c.lng)
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(c)
                }}
                aria-label={`${c.name} at ${c.area}`}
                title={`${c.name} · ${c.area}`}
                style={{
                  left: `${(x / W) * 100}%`,
                  top: `${(y / H) * 100}%`,
                }}
                className={cn(
                  'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm transition-transform hover:scale-125',
                  selectedId === c.id && 'ring-2 ring-brand-900 ring-offset-2 dark:ring-white dark:ring-offset-brand-950',
                )}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
              >
                <span
                  className="block h-4 w-4 rounded-full border-2 border-white shadow dark:border-brand-900"
                  style={{ backgroundColor: SIGNAL_META[c.signal].color }}
                />
              </motion.button>
            )
          })}
        </div>
        <p className="ml-auto rounded-full bg-brand-950/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur dark:bg-white/10">
          {visible.length} {visible.length === 1 ? t('heatmap.hotspot') : t('heatmap.hotspots')}
        </p>
      </div>
    </div>
  )
}
