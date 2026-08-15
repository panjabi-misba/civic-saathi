import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Heart,
  MapPin,
  Trash2,
  Lightbulb,
  CircleDot,
  Droplets,
  Waves,
  Wind,
  TrafficCone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import type { Complaint, Signal } from '@/types/civic'
import { SEVERITY_META, SIGNAL_META } from '@/data/mockData'
import { StatusTimeline } from '@/components/Tracker/StatusTimeline'
import { TranslatorCard } from '@/components/Tracker/TranslatorCard'
import { ResolutionVerification } from '@/components/Tracker/ResolutionVerification'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface ComplaintCardProps {
  t: (key: string) => string
  complaint: Complaint
  onSupport: (id: string) => void
  onVerify: (id: string, answer: 'yes' | 'partial' | 'no') => void
  onAttachEvidence: (id: string) => void
}

const SIGNAL_ICONS: Record<Signal, typeof Trash2> = {
  garbage: Trash2,
  streetlight: Lightbulb,
  pothole: CircleDot,
  water: Droplets,
  drainage: Waves,
  pollution: Wind,
  traffic: TrafficCone,
}

export function ComplaintCard({
  t,
  complaint,
  onSupport,
  onVerify,
  onAttachEvidence,
}: ComplaintCardProps) {
  const [open, setOpen] = useState(false)
  const severity = SEVERITY_META[complaint.severity] ?? SEVERITY_META.Medium
  const SignalIcon = SIGNAL_ICONS[complaint.signal]
  const signalMeta = SIGNAL_META[complaint.signal]
  const resolved = complaint.status === 'Resolved'
  const verifiedBadge = complaint.resolution?.verified

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={cn(
        'overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow dark:bg-brand-900',
        open
          ? 'border-brand-200 shadow-lift dark:border-white/12'
          : 'border-brand-100 hover:border-brand-200 hover:shadow-card dark:border-white/10 dark:hover:border-white/15',
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${signalMeta.color}1a`,
                color: signalMeta.color,
              }}
            >
              <SignalIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold text-brand-400">{complaint.id}</p>
              <h3 className="font-display text-sm font-bold leading-snug text-brand-900 dark:text-white sm:text-[15px]">
                {complaint.title}
              </h3>
            </div>
          </div>
          <Badge bg={severity.bg} color={severity.color} dot>
            {complaint.severity}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-brand-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {complaint.location}
          </span>
          <span>{t('tracker.reportedOn')}: {complaint.date}</span>
          <span className="flex items-center gap-1 font-semibold text-brand-500 dark:text-brand-300">
            <Heart className="h-3 w-3 text-emerald-civic" />
            {complaint.support} {t('tracker.support')}
          </span>
        </div>

        <div className="mt-4">
          <StatusTimeline status={complaint.status} compact />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] font-medium text-brand-400">
            {complaint.status === 'AI Verified' && (
              <span className="flex items-center gap-1 font-semibold text-emerald-civic-deep dark:text-emerald-civic">
                <RefreshCw className="h-3 w-3" />
                {t('tracker.verified')}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-500 transition-colors dark:text-brand-300">
            {open ? t('common.close') : t('tracker.details')}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-brand-100 p-5 dark:border-white/10">
              <div className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/50 p-3.5 dark:border-white/8 dark:bg-white/4">
                <SignalIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: signalMeta.color }} />
                <p className="text-[13px] leading-relaxed text-brand-600 dark:text-brand-200">
                  {complaint.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge bg="rgba(59,130,246,0.12)" color="#2563EB">
                  {complaint.category}
                </Badge>
                <Badge bg="rgba(16,185,129,0.12)" color="#059669">
                  {t('tracker.assignedTo')}: {complaint.department}
                </Badge>
                {complaint.confidence > 0 && (
                  <Badge bg="rgba(16,185,129,0.1)" color="#059669">
                    {t('tracker.verified')} · {complaint.confidence}%
                  </Badge>
                )}
              </div>

              {complaint.resolution && (
                <TranslatorCard
                  t={t}
                  officialResponse={complaint.resolution.officialResponse}
                  aiExplanation={complaint.resolution.aiExplanation}
                />
              )}

              {verifiedBadge && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 px-3.5 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-civic" />
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-200">
                    {t(`tracker.verifiedResult.${verifiedBadge}`)}
                  </p>
                  {complaint.resolution?.citizenNote && (
                    <p className="ml-auto text-[11px] italic text-brand-400">
                      “{complaint.resolution.citizenNote}”
                    </p>
                  )}
                </div>
              )}

              {resolved && (
                <ResolutionVerification
                  t={t}
                  complaintId={complaint.id}
                  onVerify={(answer) => onVerify(complaint.id, answer)}
                  onAttachEvidence={() => onAttachEvidence(complaint.id)}
                />
              )}

              <button
                onClick={() => onSupport(complaint.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 py-2.5 text-sm font-semibold text-emerald-civic-deep transition-colors hover:bg-emerald-civic/15 dark:text-emerald-civic"
              >
                <Heart className="h-4 w-4" />
                {t('tracker.supportThis')} ({complaint.support})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
