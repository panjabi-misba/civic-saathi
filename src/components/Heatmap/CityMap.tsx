import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { HeatmapCluster, HeatmapSignal } from '@/data/heatmapData'
import { SIGNAL_META } from '@/data/mockData'
import type { ThemeMode } from '@/types/civic'
import { MockCityMap } from '@/components/Heatmap/MockCityMap'
import { cn } from '@/utils/cn'

interface CityMapProps {
  t: (key: string) => string
  clusters: HeatmapCluster[]
  activeSignal: HeatmapSignal | 'all'
  selectedId: string | null
  theme: ThemeMode
  onSelect: (cluster: HeatmapCluster) => void
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

const MUMBAI_CENTER: [number, number] = [19.076, 72.8777]

function radiusFor(cluster: HeatmapCluster): number {
  const base = cluster.severity === 'high' ? 22 : cluster.severity === 'medium' ? 15 : 10
  return Math.max(base, Math.min(34, base + cluster.reports * 0.5))
}

function TileMonitor({ onFail }: { onFail: (failed: boolean) => void }) {
  const [loaded, setLoaded] = useState(false)
  const errorCount = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loaded) onFail(true)
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [loaded, onFail])

  useMapEvents({
    tileerror: () => {
      errorCount.current += 1
      if (errorCount.current >= 6 && !loaded) onFail(true)
    },
    tileload: () => {
      if (!loaded) {
        setLoaded(true)
        onFail(false)
      }
    },
  })

  return null
}

function FlyToController({ selected }: { selected: HeatmapCluster | null }) {
  const map = useMap()
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 13), {
        duration: 0.8,
      })
    }
  }, [selected, map])
  return null
}

export function CityMap({
  t,
  clusters,
  activeSignal,
  selectedId,
  theme,
  onSelect,
}: CityMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false)
  const source = TILE_SOURCES[theme]

  const visible = activeSignal === 'all' ? clusters : clusters.filter((c) => c.signal === activeSignal)
  const selected = clusters.find((c) => c.id === selectedId) ?? null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 dark:border-white/10">
      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-brand-600 shadow-md backdrop-blur dark:bg-brand-900/85 dark:text-brand-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-civic" />
        {t('heatmap.liveMap')}
      </div>

      <div className={cn('h-[420px] w-full lg:h-[560px]', tilesFailed && 'hidden')}>
        <MapContainer
          center={MUMBAI_CENTER}
          zoom={11}
          minZoom={9}
          maxZoom={16}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileMonitor onFail={setTilesFailed} />
          <FlyToController selected={selected} />
          <TileLayer {...source} />
          {visible.map((cluster) => (
            <CircleMarker
              key={cluster.id}
              center={[cluster.lat, cluster.lng]}
              radius={radiusFor(cluster)}
              pathOptions={{
                color: SIGNAL_META[cluster.signal].color,
                weight: selectedId === cluster.id ? 3 : 1.5,
                fillColor: SIGNAL_META[cluster.signal].color,
                fillOpacity: selectedId === cluster.id ? 0.65 : 0.28,
              }}
              eventHandlers={{
                click: () => onSelect(cluster),
              }}
            >
              <Popup closeButton={false} autoPan>
                <div className="min-w-[190px]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {cluster.area}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{cluster.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: SIGNAL_META[cluster.signal].color }}
                      />
                      {cluster.reports} {t('heatmap.reportsLabel')}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {cluster.lastSeen}
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {tilesFailed && (
        <MockCityMap
          t={t}
          clusters={clusters}
          activeSignal={activeSignal}
          selectedId={selectedId}
          onSelect={onSelect}
          className="h-[420px] lg:h-[560px]"
        />
      )}
    </div>
  )
}
