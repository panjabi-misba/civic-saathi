import { motion } from 'framer-motion'
import { MapPin, Heart, ChevronRight, Users, Building2, ShieldCheck } from 'lucide-react'
import type { Complaint } from '@/types/civic'
import { SEVERITY_META, SIGNAL_META } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface FeedCardProps {
  t: (key: string) => string
  complaint: Complaint
  distanceLabel?: string
  isSupported?: boolean
  onOpen: (id: string) => void
  onSupport: (id: string) => void
  index?: number
}

function daysAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000
  if (diff < 1) return 'today'
  return `${Math.round(diff)}d`
}

function progressColor(p: number): string {
  if (p >= 100) return 'bg-emerald-civic'
  if (p >= 60) return 'bg-emerald-civic/80'
  if (p >= 30) return 'bg-amber-500'
  return 'bg-brand-400'
}

export function FeedCard({
  t,
  complaint,
  distanceLabel,
  isSupported,
  onOpen,
  onSupport,
  index = 0,
}: FeedCardProps) {
  const severity = SEVERITY_META[complaint.severity] ?? SEVERITY_META.Medium
  const signal = SIGNAL_META[complaint.signal]
  const disputed = complaint.status === 'Citizen Disputed'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 26,
        delay: Math.min(index * 0.05, 0.3),
      }}
      className="group relative overflow-hidden rounded-3xl border border-brand-100 bg-white/80 shadow-sm backdrop-blur transition-shadow hover:border-brand-200 hover:shadow-card dark:border-white/10 dark:bg-brand-900/70 dark:hover:border-white/20"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${signal.color}, transparent 70%)` }}
      />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base"
              style={{ backgroundColor: `${signal.color}1a` }}
            >
              {signal.emoji}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: signal.color }}>
                {signal.label}
              </span>
              <p className="font-mono text-[10px] font-semibold text-brand-400">{complaint.id}</p>
              <h3 className="truncate font-display text-[15px] font-bold leading-snug text-brand-900 dark:text-white">
                {complaint.title}
              </h3>
            </div>
          </div>
          <Badge bg={severity.bg} color={severity.color} dot pulse={complaint.severity === 'Critical'}>
            {complaint.severity}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-brand-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-brand-400" />
            <span className="font-semibold text-brand-600 dark:text-brand-300">{complaint.location}</span>
          </span>
          {distanceLabel && (
            <span className="rounded-full bg-brand-100/80 px-2 py-0.5 font-semibold text-brand-600 dark:bg-white/10 dark:text-brand-300">
              {distanceLabel}
            </span>
          )}
          <span>
            {t('feed.reported')}: {daysAgo(complaint.reportedAt)}
          </span>
          <span>
            {t('feed.reportedBy')}: {complaint.isMine ? t('profile.name') : t('feed.anonymous')}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-brand-500 dark:text-brand-300">
          {complaint.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge bg="rgba(59,130,246,0.12)" color="#2563EB">
            {complaint.category}
          </Badge>
          <Badge bg="rgba(139,92,246,0.12)" color="#7c3aed">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {complaint.reportCount} {t('feed.affected')}
            </span>
          </Badge>
          <Badge bg="rgba(16,185,129,0.1)" color="#059669">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {complaint.support} {t('feed.supporting')}
            </span>
          </Badge>
          <Badge bg={severity.bg} color={severity.color}>
            {t('feed.status')}: {complaint.status}
          </Badge>
          {complaint.communitySignal && (
            <Badge bg="rgba(16,185,129,0.12)" color="#059669" dot pulse>
              {complaint.signalStrength === 'strong' ? t('feed.strongSignal') : t('feed.growingSignal')}
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-brand-400">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{complaint.department}</span>
            </span>
            <span className="shrink-0 font-bold text-brand-600 dark:text-brand-300">{complaint.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${complaint.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={cn('h-full rounded-full', progressColor(complaint.progress))}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onSupport(complaint.id)}
            disabled={isSupported}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all',
              isSupported
                ? 'border border-emerald-civic/30 bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic'
                : 'border border-emerald-civic/25 bg-emerald-civic/8 text-emerald-civic-deep hover:bg-emerald-civic/15 dark:text-emerald-civic',
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', isSupported && 'fill-current')} />
            {isSupported
              ? `${t('feed.supported')} · ${complaint.support}`
              : `${t('feed.facingToo')} · ${complaint.support}`}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onOpen(complaint.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 py-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200 dark:hover:bg-white/10"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
            {t('feed.viewDetails')}
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        {disputed && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {t('detail.disputedStatus')} — {t('detail.disputedMsg')}
            </p>
          </div>
        )}
      </div>
    </motion.article>
  )
}
