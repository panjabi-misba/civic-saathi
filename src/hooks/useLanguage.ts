import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Language } from '@/types/civic'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { translations } from '@/i18n/translations'

type AnyRecord = Record<string, unknown>

function resolve(t: AnyRecord, key: string): string {
  const parts = key.split('.')
  let node: unknown = t
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key
    node = (node as AnyRecord)[part]
  }
  return typeof node === 'string' ? node : key
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() =>
    loadFromStorage<Language>('language', 'en'),
  )

  useEffect(() => {
    saveToStorage('language', language)
  }, [language])

  const t = useCallback(
    (key: string): string => resolve(translations[language], key),
    [language],
  )

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
  }, [])

  const value = useMemo(
    () => ({ language, t, changeLanguage }),
    [language, t, changeLanguage],
  )

  return value
}
