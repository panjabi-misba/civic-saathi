import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CivicArea } from '@/types/civic'
import { CIVIC_AREAS } from '@/data/mockData'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

export function useArea() {
  const [area, setArea] = useState<CivicArea>(() => {
    const stored = loadFromStorage<CivicArea | null>('area', null)
    if (stored && CIVIC_AREAS.some((a) => a.id === stored.id)) return stored
    return CIVIC_AREAS[0]
  })

  useEffect(() => {
    saveToStorage('area', area)
  }, [area])

  const changeArea = useCallback((next: CivicArea) => {
    setArea(next)
  }, [])

  const value = useMemo(() => ({ area, changeArea }), [area, changeArea])
  return value
}
