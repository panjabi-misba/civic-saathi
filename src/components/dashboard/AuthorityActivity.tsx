import { motion } from 'framer-motion'
import { Landmark } from 'lucide-react'
import type { AuthorityActionFeed } from '@/types/civic'
import { SectionHeader } from '@/components/ui/SectionHeader'

const KIND_ICONS: Record<string, string> = {
  inspection: '🏛',
  crew: '🧹',
  evidence: '📸',
  repair: '🚧',
  response: '📋',
  update: '🔄',
}

interface AuthorityActivityProps {
  t: (key: string) => string
  activities: AuthorityActionFeed[]
  limit?: number
}

export function AuthorityActivity({ t, activities, limit }: AuthorityActivityProps) {
  const shown = limit ? activities.slice(0, limit) : activities
  return (
    <div>
      <SectionHeader
        icon={<Landmark className="h-4 w-4" />}
        title={t('dashboard.authorityActivity')}
        subtitle="BMC Ward Office"
      />
      <div className="space-y-2.5">
        {shown.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100/70 text-lg dark:bg-white/8">
              {KIND_ICONS[act.kind] ?? '📋'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-brand-900 dark:text-white">{act.actor}</p>
                <span className="shrink-0 text-[10px] font-medium text-brand-400">{act.time}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-civic-deep dark:text-emerald-civic">
                {act.role}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-600 dark:text-brand-200">
                {act.action}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
