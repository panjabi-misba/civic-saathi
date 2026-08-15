import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CitizenProfile } from '@/types/civic'
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/storage'

export function useAuth() {
  const [profile, setProfile] = useState<CitizenProfile | null>(() =>
    loadFromStorage<CitizenProfile | null>('auth', null),
  )

  useEffect(() => {
    if (profile) saveToStorage('auth', profile)
  }, [profile])

  const login = useCallback((citizen: CitizenProfile) => {
    setProfile(citizen)
  }, [])

  const updateProfile = useCallback((patch: Partial<CitizenProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const logout = useCallback(() => {
    setProfile(null)
    removeFromStorage('auth')
  }, [])

  const value = useMemo(
    () => ({ profile, isAuthenticated: profile !== null, login, logout, updateProfile }),
    [profile, login, logout, updateProfile],
  )

  return value
}
