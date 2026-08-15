import { motion } from 'framer-motion'
import { MapPin, Users, Zap, Heart } from 'lucide-react'
import type { SimilarReport } from '@/types/civic'
import { formatDistance } from '@/utils/geo'

interface SimilarIssuesProps {
  t: (key: string) => string
  similar: SimilarReport[]
  onSupport: (report: SimilarReport) => void
  onCreateSeparate: () => void
}

export function SimilarIssues({ t, similar, onSupport, onCreateSeparate }: SimilarIssuesProps) {
  if (similar.length === 0) return null
  const top = similar[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.18 }}
      className="overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/6 via-white to-emerald-civic/6 p-5 shadow-lift dark:from-violet-500/10 dark:via-brand-900 dark:to-emerald-civic/8"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/12 text-violet-500">
          <Zap className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold text-brand-900 dark:text-white">
            {t('vision.similarTitle')}
          </h3>
          <p className="text-[11px] text-brand-400">{t('vision.similarSub')}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold text-brand-400">{top.id}</p>
            <h4 className="mt-0.5 truncate font-display text-sm font-bold text-brand-900 dark:text-white">
              {top.title}
            </h4>
          </div>
          <span className="shrink-0 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-600 dark:text-violet-400">
            {top.status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-brand-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {formatDistance(top.distanceKm)} away
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-civic-deep dark:text-emerald-civic">
            <Users className="h-3 w-3" />
            {top.support} {t('feed.citizens')}
          </span>
          {similar.length > 1 && (
            <span className="text-[10px] text-brand-400">
              +{similar.length - 1} more similar {t('feed.reports')}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-brand-500 dark:text-brand-300">
        {t('vision.similarAsk')}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => onSupport(top)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-civic px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-civic-deep"
        >
          <Heart className="h-3.5 w-3.5" />
          {t('vision.supportExisting')}
        </button>
        <button
          onClick={onCreateSeparate}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
        >
          {t('vision.createSeparate')}
        </button>
      </div>
    </motion.div>
  )
}
