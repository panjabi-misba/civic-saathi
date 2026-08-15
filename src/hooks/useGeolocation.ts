import { useCallback, useState } from 'react'
import type { CivicLocation } from '@/types/civic'
import { findNearestLocation } from '@/data/locations'

type GeoError = 'unavailable' | 'denied'

export function useGeolocation() {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<GeoError | null>(null)
  const [nearest, setNearest] = useState<CivicLocation | null>(null)

  const locate = useCallback((): Promise<CivicLocation | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setError('unavailable')
        resolve(null)
        return
      }
      setLocating(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = findNearestLocation(pos.coords.latitude, pos.coords.longitude)
          setNearest(loc)
          setLocating(false)
          resolve(loc)
        },
        () => {
          setLocating(false)
          setError('denied')
          resolve(null)
        },
        { timeout: 8000, maximumAge: 60000 },
      )
    })
  }, [])

  return { locating, error, nearest, locate }
}
