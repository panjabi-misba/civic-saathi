import { ChevronDown, LocateFixed } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CivicLocation } from '@/types/civic'
import { LOCATION_TYPE_META, MUMBAI_LOCATIONS } from '@/data/locations'
import { RADIUS_OPTIONS } from '@/hooks/useLocation'
import { LocationSearch } from '@/components/location/LocationSearch'
import { Modal } from '@/components/ui/Modal'
import { haversineKm } from '@/utils/geo'
import { cn } from '@/utils/cn'

interface LocationPickerProps {
  t: (key: string) => string
  location: CivicLocation
  radiusKm: number
  onLocationChange: (loc: CivicLocation) => void
  onRadiusChange: (r: number) => void
  recentLocations: CivicLocation[]
  clearRecent: () => void
  onUseCurrentLocation: () => void
  locating: boolean
}

export function LocationPicker({
  t,
  location,
  radiusKm,
  onLocationChange,
  onRadiusChange,
  recentLocations,
  clearRecent,
  onUseCurrentLocation,
  locating,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false)

  const nearbyLandmarks = useMemo(() => {
    return MUMBAI_LOCATIONS.filter(
      (l) => l.type !== 'locality' && l.id !== location.id && haversineKm(location.lat, location.lng, l.lat, l.lng) <= 2.5,
    ).slice(0, 5)
  }, [location])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-3.5 py-2.5 text-left shadow-sm transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-brand-900/60 dark:hover:bg-white/8"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic">
          {LOCATION_TYPE_META[location.type].icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-brand-900 dark:text-white">{location.name}</span>
          <span className="block truncate text-[11px] text-brand-400">
            {location.city}, {location.state} · {radiusKm} km
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-400" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('location.changeTitle')} size="sm">
        <div className="space-y-4">
          <LocationSearch
            t={t}
            value={location}
            onChange={(loc) => {
              if (loc) onLocationChange(loc)
              setOpen(false)
            }}
            recentLocations={recentLocations}
            clearRecent={clearRecent}
            onUseCurrentLocation={onUseCurrentLocation}
            locating={locating}
          />

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-400">
              {t('location.within')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all',
                    radiusKm === r
                      ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                      : 'bg-brand-100/70 text-brand-500 hover:bg-brand-100 dark:bg-white/8 dark:text-brand-300',
                  )}
                >
                  {r < 1 ? `${Math.round(r * 1000)} m` : `${r} km`}
                </button>
              ))}
            </div>
          </div>

          {nearbyLandmarks.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-400">
                {t('location.nearbyLandmarks')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nearbyLandmarks.map((lm) => (
                  <button
                    key={lm.id}
                    onClick={() => {
                      onLocationChange(lm)
                      setOpen(false)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-brand-600 transition-colors hover:border-emerald-civic/40 hover:bg-emerald-civic/8 dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
                  >
                    <span className="text-xs">{LOCATION_TYPE_META[lm.type].icon}</span>
                    {lm.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onUseCurrentLocation}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 py-2.5 text-xs font-bold text-emerald-civic-deep transition-colors hover:bg-emerald-civic/15 dark:text-emerald-civic"
          >
            <LocateFixed className="h-4 w-4" />
            {locating ? t('location.locating') : t('location.useCurrentLocation')}
          </button>
        </div>
      </Modal>
    </>
  )
}
