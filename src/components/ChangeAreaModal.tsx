import { AnimatePresence, motion } from 'framer-motion'
import { Check, MapPin, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CivicArea } from '@/types/civic'
import { CIVIC_AREAS } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface ChangeAreaModalProps {
  open: boolean
  onClose: () => void
  current: CivicArea
  onApply: (area: CivicArea) => void
  t: (key: string) => string
}

export function ChangeAreaModal({ open, onClose, current, onApply, t }: ChangeAreaModalProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CIVIC_AREAS
    return CIVIC_AREAS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.pincode.includes(q) ||
        a.landmark.toLowerCase().includes(q),
    )
  }, [query])

  const handleApply = (area: CivicArea) => {
    onApply(area)
    setQuery('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('changeArea.title')}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-brand-200/60 bg-white shadow-lift sm:max-w-lg sm:rounded-2xl dark:border-white/10 dark:bg-brand-900"
          >
            <div className="border-b border-brand-100 px-5 py-4 dark:border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-brand-900 dark:text-white">
                    {t('changeArea.title')}
                  </h3>
                  <p className="mt-0.5 text-xs text-brand-400">{t('changeArea.sub')}</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('changeArea.search')}
                  className="w-full rounded-xl border border-brand-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-brand-900 transition-colors placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-900/60 dark:text-brand-50 dark:placeholder:text-brand-500"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto p-3 scrollbar-thin">
              {filtered.map((area) => {
                const isCurrent = current.id === area.id
                return (
                  <motion.button
                    key={area.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApply(area)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                      isCurrent
                        ? 'border-emerald-civic/40 bg-emerald-civic/8'
                        : 'border-brand-100 bg-white/70 hover:border-brand-200 dark:border-white/8 dark:bg-white/4 dark:hover:border-white/20',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        isCurrent
                          ? 'bg-emerald-civic/15 text-emerald-civic-deep dark:text-emerald-civic'
                          : 'bg-brand-100/80 text-brand-500 dark:bg-white/8',
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-brand-900 dark:text-white">
                          {area.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-civic/15 px-2 py-0.5 text-[10px] font-bold text-emerald-civic-deep dark:text-emerald-civic">
                            {t('changeArea.current')}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[11px] text-brand-400">
                        {area.city} · {t('changeArea.pincode')} {area.pincode} · {area.landmark}
                      </span>
                    </span>
                    {isCurrent && <Check className="h-4 w-4 shrink-0 text-emerald-civic" />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
