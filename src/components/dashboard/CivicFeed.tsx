import { motion } from 'framer-motion'
import { Inbox, Sparkles } from 'lucide-react'
import type { Complaint } from '@/types/civic'
import { FeedCard } from '@/components/dashboard/FeedCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface CivicFeedProps {
  t: (key: string) => string
  complaints: Complaint[]
  isSupported: (id: string) => boolean
  onOpen: (id: string) => void
  onSupport: (id: string) => void
  onViewAll?: () => void
  viewAllLabel?: string
  title?: string
  subtitle?: string
  limit?: number
}

export function CivicFeed({
  t,
  complaints,
  isSupported,
  onOpen,
  onSupport,
  onViewAll,
  viewAllLabel,
  title,
  subtitle,
  limit,
}: CivicFeedProps) {
  const shown = limit ? complaints.slice(0, limit) : complaints

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-brand-900/30">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100/70 text-brand-400 dark:bg-white/8">
          <Inbox className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">{t('feed.noIssues')}</p>
        <p className="max-w-sm text-xs text-brand-400">{t('feed.noIssuesSub')}</p>
      </div>
    )
  }

  return (
    <div>
      {(title || subtitle || onViewAll) && (
        <SectionHeader
          icon={<Sparkles className="h-4 w-4" />}
          title={title ?? ''}
          subtitle={subtitle}
          actionLabel={viewAllLabel}
          onAction={onViewAll}
        />
      )}
      <div className="space-y-3">
        {shown.map((complaint, i) => (
          <FeedCard
            key={complaint.id}
            t={t}
            complaint={complaint}
            isSupported={isSupported(complaint.id)}
            onOpen={onOpen}
            onSupport={onSupport}
            index={i}
          />
        ))}
      </div>
      {limit && complaints.length > limit && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onViewAll}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-brand-200 bg-white/60 py-2.5 text-xs font-bold text-brand-500 transition-colors hover:bg-brand-50 dark:border-white/10 dark:bg-white/4 dark:text-brand-300 dark:hover:bg-white/8"
        >
          {t('dashboard.viewAll')} ({complaints.length})
        </motion.button>
      )}
    </div>
  )
}
