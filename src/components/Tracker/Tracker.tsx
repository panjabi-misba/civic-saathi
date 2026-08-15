import { motion } from 'framer-motion'
import { ListChecks, Search, Inbox } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Complaint, ComplaintStatus } from '@/types/civic'
import { ComplaintCard } from '@/components/Tracker/ComplaintCard'
import { cn } from '@/utils/cn'

interface TrackerProps {
  t: (key: string) => string
  complaints: Complaint[]
  onSupport: (id: string) => void
  onVerify: (id: string, answer: 'yes' | 'partial' | 'no') => void
  onAttachEvidence: (id: string) => void
  toastSuccess: (title: string, message?: string) => void
  toastInfo: (title: string, message?: string) => void
}

type Filter = 'all' | ComplaintStatus

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'tracker.all' },
  { key: 'Reported', labelKey: 'tracker.reported' },
  { key: 'Assigned', labelKey: 'tracker.assigned' },
  { key: 'In Progress', labelKey: 'tracker.inProgress' },
  { key: 'Resolved', labelKey: 'tracker.resolved' },
]

export function Tracker({
  t,
  complaints,
  onSupport,
  onVerify,
  onAttachEvidence,
  toastSuccess,
  toastInfo,
}: TrackerProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return complaints.filter((c) => {
      const matchesFilter = filter === 'all' || c.status === filter
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [complaints, filter, query])

  const counts = useMemo(() => {
    const by: Record<string, number> = { all: complaints.length }
    for (const c of complaints) by[c.status] = (by[c.status] ?? 0) + 1
    return by
  }, [complaints])

  const handleVerify = (id: string, answer: 'yes' | 'partial' | 'no') => {
    onVerify(id, answer)
    if (answer === 'no') {
      toastInfo(t('tracker.reopened'))
    } else {
      toastSuccess(t('toasts.verified'))
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-civic/20 bg-emerald-civic/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-civic-deep dark:text-emerald-civic">
          <ListChecks className="h-3.5 w-3.5" />
          {t('tracker.title')} · {complaints.length}
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          <span className="text-gradient-civic">{t('tracker.title')}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-brand-500 dark:text-brand-300">
          {t('tracker.sub')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-7 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('tracker.search')}
              aria-label={t('tracker.search')}
              className="w-full rounded-xl border border-brand-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-brand-900 transition-colors placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-900/60 dark:text-brand-50 dark:placeholder:text-brand-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-brand-200 bg-white/70 p-1 scrollbar-thin dark:border-white/10 dark:bg-white/5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  filter === f.key
                    ? 'bg-brand-900 text-white shadow-sm dark:bg-white dark:text-brand-900'
                    : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
                )}
              >
                {t(f.labelKey)}
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                    filter === f.key
                      ? 'bg-white/15 dark:bg-brand-900/10'
                      : 'bg-brand-100/70 dark:bg-white/10',
                  )}
                >
                  {counts[f.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/60 py-16 text-center dark:border-white/12 dark:bg-brand-900/40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100/70 text-brand-400 dark:bg-white/8">
              <Inbox className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">
              {t('tracker.noResults')}
            </p>
            <button
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
              className="text-xs font-semibold text-emerald-civic-deep underline-offset-2 hover:underline dark:text-emerald-civic"
            >
              {t('common.cancel')}
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                t={t}
                complaint={complaint}
                onSupport={onSupport}
                onVerify={handleVerify}
                onAttachEvidence={onAttachEvidence}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
