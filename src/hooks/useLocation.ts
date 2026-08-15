import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CivicLocation } from '@/types/civic'
import { DEFAULT_LOCATION, MUMBAI_LOCATIONS } from '@/data/locations'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

export const RADIUS_OPTIONS = [0.5, 1, 3, 5] as const
export type RadiusKm = (typeof RADIUS_OPTIONS)[number]

const VALID_IDS = new Set(MUMBAI_LOCATIONS.map((l) => l.id))

function isValidLocation(value: unknown): value is CivicLocation {
  if (!value || typeof value !== 'object') return false
  const loc = value as Record<string, unknown>
  return (
    typeof loc.id === 'string' &&
    typeof loc.name === 'string' &&
    typeof loc.area === 'string' &&
    typeof loc.city === 'string' &&
    typeof loc.lat === 'number' &&
    typeof loc.lng === 'number'
  )
}

function migrateFromArea(): CivicLocation {
  const stored = loadFromStorage<Record<string, unknown> | null>('area', null)
  if (stored && typeof stored.name === 'string' && typeof stored.lat === 'number' && typeof stored.lng === 'number') {
    const storedName = stored.name.toLowerCase()
    const found = MUMBAI_LOCATIONS.find(
      (l) => l.id === stored.id || l.name.toLowerCase() === storedName || l.area.toLowerCase() === storedName,
    )
    if (found) return found
  }
  return DEFAULT_LOCATION
}

function initialLocation(): CivicLocation {
  const stored = loadFromStorage<CivicLocation | null>('location', null)
  if (stored && VALID_IDS.has(stored.id)) return stored
  return migrateFromArea()
}

function initialRadius(): RadiusKm {
  const r = loadFromStorage<number>('radius-km', 3)
  return (RADIUS_OPTIONS as readonly number[]).includes(r) ? (r as RadiusKm) : 3
}

function initialRecent(): CivicLocation[] {
  const stored = loadFromStorage<unknown>('recent-locations', [])
  if (!Array.isArray(stored)) return []
  return stored.filter(isValidLocation).slice(0, 5)
}

export function useLocation() {
  const [location, setLocation] = useState<CivicLocation>(initialLocation)
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(initialRadius)
  const [recentLocations, setRecentLocations] = useState<CivicLocation[]>(initialRecent)

  useEffect(() => {
    saveToStorage('location', location)
  }, [location])

  useEffect(() => {
    saveToStorage('radius-km', radiusKm)
  }, [radiusKm])

  useEffect(() => {
    saveToStorage('recent-locations', recentLocations)
  }, [recentLocations])

  const changeLocation = useCallback((next: CivicLocation) => {
    setLocation(next)
    setRecentLocations((prev) => [next, ...prev.filter((l) => l.id !== next.id)].slice(0, 5))
  }, [])

  const clearRecent = useCallback(() => {
    setRecentLocations([])
  }, [])

  const value = useMemo(
    () => ({
      location,
      radiusKm,
      recentLocations,
      changeLocation,
      setRadiusKm,
      clearRecent,
    }),
    [location, radiusKm, recentLocations, changeLocation, setRadiusKm, clearRecent],
  )

  return value
}
