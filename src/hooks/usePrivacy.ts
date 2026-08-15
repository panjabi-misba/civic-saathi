import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PrivacySettings } from '@/types/civic'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

export const DEFAULT_PRIVACY: PrivacySettings = {
  blurFaces: true,
  blurPlates: true,
  hideName: true,
  approximateLocation: true,
  showNamePublic: false,
}

export function usePrivacy() {
  const [settings, setSettings] = useState<PrivacySettings>(() =>
    loadFromStorage<PrivacySettings>('privacy', DEFAULT_PRIVACY),
  )

  useEffect(() => {
    saveToStorage('privacy', settings)
  }, [settings])

  const update = useCallback((patch: Partial<PrivacySettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const value = useMemo(() => ({ settings, update }), [settings, update])
  return value
}
