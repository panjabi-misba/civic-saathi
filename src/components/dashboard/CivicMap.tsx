import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Complaint, ThemeMode } from '@/types/civic'
import { SIGNAL_META } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface CivicMapProps {
  t: (key: string) => string
  complaints: Complaint[]
  center: [number, number]
  zoom?: number
  theme: ThemeMode
  selectedId: string | null
  onSelect: (id: string) => void
}

const TILE_SOURCES: Record<ThemeMode, { url: string; attribution: string }> = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
}

function TileMonitor({ onFail }: { onFail: (failed: boolean) => void }) {
  const [loaded, setLoaded] = useState(false)
  const errorCount = useRef(0)

  useMapEvents({
    tileerror: () => {
      errorCount.current += 1
      if (errorCount.current >= 4 && !loaded) onFail(true)
    },
    tileload: () => {
      if (!loaded) {
        setLoaded(true)
        onFail(false)
      }
    },
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loaded) onFail(true)
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [loaded, onFail])

  return null
}

export function CivicMap({ t, complaints, center, zoom = 13, theme, selectedId, onSelect }: CivicMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false)
  const source = TILE_SOURCES[theme]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 dark:border-white/10">
      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-brand-600 shadow-md backdrop-blur dark:bg-brand-900/85 dark:text-brand-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-civic" />
        {t('overview.liveMap')}
      </div>

      <div className={cn('h-[320px] w-full', tilesFailed && 'hidden')}>
        <MapContainer center={center} zoom={zoom} minZoom={10} maxZoom={16} scrollWheelZoom className="h-full w-full">
          <TileMonitor onFail={setTilesFailed} />
          <TileLayer {...source} />
          {complaints.map((c) => {
            const color = SIGNAL_META[c.signal].color
            return (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={selectedId === c.id ? 11 : 7}
                pathOptions={{
                  color,
                  weight: selectedId === c.id ? 3 : 1.5,
                  fillColor: color,
                  fillOpacity: selectedId === c.id ? 0.7 : 0.3,
                }}
                eventHandlers={{ click: () => onSelect(c.id) }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="max-w-[200px]">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.area}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900">{c.title}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {tilesFailed && (
        <div className="flex h-[320px] w-full items-center justify-center bg-brand-50 dark:bg-brand-900/40">
          <div className="px-6 text-center">
            <p className="text-sm font-bold text-brand-700 dark:text-brand-200">{t('overview.mapFallback')}</p>
            <p className="mt-1 text-xs text-brand-400">{complaints.length} {t('overview.issuesHere')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
