import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, History, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CivicLocation } from '@/types/civic'
import { LOCATION_TYPE_META, searchLocations } from '@/data/locations'
import { cn } from '@/utils/cn'

interface LocationSearchProps {
  t: (key: string) => string
  value: CivicLocation | null
  onChange: (loc: CivicLocation | null) => void
  placeholder?: string
  recentLocations?: CivicLocation[]
  clearRecent?: () => void
  onUseCurrentLocation?: () => void
  locating?: boolean
  autoFocus?: boolean
}

export function LocationSearch({
  t,
  value,
  onChange,
  placeholder,
  recentLocations = [],
  clearRecent,
  onUseCurrentLocation,
  locating = false,
  autoFocus = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value ? value.name : '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CivicLocation[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (value) setQuery(value.name)
  }, [value])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    setLoading(true)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      setResults(q ? searchLocations(q, 8) : [])
      setLoading(false)
      setActive(0)
    }, 180)
    return () => window.clearTimeout(searchTimer.current)
  }, [query, open])

  const list = query.trim() ? results : recentLocations

  const select = (loc: CivicLocation) => {
    onChange(loc)
    setQuery(loc.name)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, list.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const loc = list[active]
      if (loc) select(loc)
    }
  }

  const showDropdown = open && (query.trim() || recentLocations.length > 0 || onUseCurrentLocation)

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400">
          {value ? <MapPin className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('location.searchPlaceholder')}
          aria-label={t('location.searchPlaceholder')}
          aria-expanded={open}
          className="w-full rounded-xl border border-brand-200 bg-white/80 py-2.5 pl-10 pr-9 text-sm text-brand-900 transition-colors placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-900/60 dark:text-brand-50 dark:placeholder:text-brand-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              onChange(null)
              inputRef.current?.focus()
            }}
            aria-label={t('common.clear')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-brand-200 bg-white shadow-lift scrollbar-thin dark:border-white/12 dark:bg-brand-800"
            role="listbox"
          >
            {!query.trim() && onUseCurrentLocation && (
              <button
                role="option"
                onClick={() => {
                  onUseCurrentLocation()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-emerald-civic-deep transition-colors hover:bg-emerald-civic/8 dark:text-emerald-civic"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-civic/10">
                  <LocateFixed className="h-4 w-4" />
                </span>
                <span>
                  {locating ? t('location.locating') : t('location.useCurrentLocation')}
                  <span className="block text-[11px] font-normal text-brand-400">
                    {t('location.useCurrentLocationSub')}
                  </span>
                </span>
                {locating && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </button>
            )}

            {!query.trim() && recentLocations.length > 0 && (
              <div className="flex items-center justify-between px-4 pb-1 pt-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-400">
                  <History className="h-3 w-3" />
                  {t('location.recentLocations')}
                </span>
                {clearRecent && (
                  <button
                    onClick={clearRecent}
                    className="text-[10px] font-semibold text-brand-400 underline-offset-2 hover:underline"
                  >
                    {t('location.clearRecent')}
                  </button>
                )}
              </div>
            )}

            {list.map((loc, i) => {
              const meta = LOCATION_TYPE_META[loc.type]
              const selected = i === active
              return (
                <button
                  key={loc.id}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => select(loc)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    selected ? 'bg-brand-50 dark:bg-white/8' : 'hover:bg-brand-50/60 dark:hover:bg-white/5',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100/80 text-base dark:bg-white/8">
                    {meta.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-900 dark:text-white">
                      {loc.name}
                    </span>
                    <span className="block truncate text-[11px] text-brand-400">
                      {loc.type === 'locality'
                        ? `${loc.city}, ${loc.state}`
                        : `${loc.area}, ${loc.city}`}
                    </span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-300" />
                </button>
              )
            })}

            {loading && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-brand-400">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-civic" />
                {t('location.searching')}
              </div>
            )}

            {query.trim() && !loading && results.length === 0 && (
              <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
                <span className="text-xl">📍</span>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">
                  {t('location.noLocationsFound')}
                </p>
                <p className="text-[11px] text-brand-400">{t('location.noLocationsSub')}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
