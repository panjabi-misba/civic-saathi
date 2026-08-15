import { motion } from 'framer-motion'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Heart,
  Landmark,
  Lightbulb,
  MapPin,
  MessageSquare,
  Paperclip,
  RefreshCw,
  ShieldAlert,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import type { Complaint } from '@/types/civic'
import { SEVERITY_META, SIGNAL_META } from '@/data/mockData'
import { StatusTimeline } from '@/components/Tracker/StatusTimeline'
import { TranslatorCard } from '@/components/Tracker/TranslatorCard'
import { ResolutionVerification } from '@/components/Tracker/ResolutionVerification'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface ComplaintDetailProps {
  t: (key: string) => string
  complaint: Complaint
  distanceLabel?: string
  isSupported: boolean
  onClose: () => void
  onSupport: (id: string) => void
  onVerify: (id: string, answer: 'yes' | 'partial' | 'no') => void
  onAttachEvidence: (id: string, files: File[]) => void
  onAddComment: (id: string, text: string) => void
}

const KIND_ICONS: Record<string, string> = {
  inspection: '🏛',
  crew: '🧹',
  evidence: '📸',
  repair: '🚧',
  response: '📋',
  update: '🔄',
}

export function ComplaintDetail({
  t,
  complaint,
  distanceLabel,
  isSupported,
  onClose,
  onSupport,
  onVerify,
  onAttachEvidence,
  onAddComment,
}: ComplaintDetailProps) {
  const [comment, setComment] = useState('')
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const severity = SEVERITY_META[complaint.severity] ?? SEVERITY_META.Medium
  const signal = SIGNAL_META[complaint.signal]
  const resolved = complaint.status === 'Resolved'
  const disputed = complaint.status === 'Citizen Disputed'

  const postComment = () => {
    const text = comment.trim()
    if (!text) return
    onAddComment(complaint.id, text)
    setComment('')
  }

  return (
    <Modal open onClose={onClose} title={t('detail.title')} size="lg">
      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
                style={{ backgroundColor: `${signal.color}1a` }}
              >
                {signal.emoji}
              </span>
              <div>
                <p className="font-mono text-[10px] font-semibold text-brand-400">{complaint.id}</p>
                <h3 className="font-display text-lg font-bold leading-snug text-brand-900 dark:text-white">
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
              <MapPin className="h-3 w-3" />
              <span className="font-semibold text-brand-600 dark:text-brand-300">{complaint.location}</span>
            </span>
            {distanceLabel && (
              <span className="rounded-full bg-brand-100/80 px-2 py-0.5 font-semibold text-brand-600 dark:bg-white/10 dark:text-brand-300">
                {distanceLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {complaint.date}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge bg="rgba(59,130,246,0.12)" color="#2563EB">{complaint.category}</Badge>
          <Badge bg="rgba(100,116,139,0.1)" color="#64748b">
            <span className="flex items-center gap-1">
              <Landmark className="h-3 w-3" />
              {complaint.department}
            </span>
          </Badge>
          {complaint.confidence > 0 && (
            <Badge bg="rgba(16,185,129,0.1)" color="#059669">
              {t('detail.confidence')}: {complaint.confidence}%
            </Badge>
          )}
        </div>

        <p className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-[13px] leading-relaxed text-brand-600 dark:border-white/8 dark:bg-white/4 dark:text-brand-200">
          {complaint.description}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t('feed.status')}</p>
            <p className="mt-1 text-sm font-bold text-brand-900 dark:text-white">{complaint.status}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t('feed.progress')}</p>
            <p className="mt-1 text-sm font-bold text-emerald-civic-deep dark:text-emerald-civic">{complaint.progress}%</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t('feed.supportIssue')}</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-bold text-brand-900 dark:text-white">
              <Heart className="h-3.5 w-3.5 text-emerald-civic" />
              {complaint.support}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t('feed.affected')}</p>
            <p className="mt-1 text-sm font-bold text-brand-900 dark:text-white">{complaint.reportCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 dark:bg-white/8">
              <RefreshCw className="h-4 w-4 text-brand-500 dark:text-brand-300" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
              {t('detail.timeline')}
            </p>
          </div>
          <StatusTimeline status={complaint.status} />
          <div className="mt-4 space-y-2.5">
            {complaint.timeline.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-3 py-2.5',
                  entry.status === 'current'
                    ? 'border-amber-500/30 bg-amber-500/6'
                    : entry.status === 'done'
                      ? 'border-emerald-civic/20 bg-emerald-civic/6'
                      : 'border-brand-100 bg-white/60 dark:border-white/8 dark:bg-white/4',
                )}
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-brand-900 dark:text-white">{entry.label}</p>
                    <span className="shrink-0 text-[10px] text-brand-400">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-brand-500 dark:text-brand-300">
                    {entry.description}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-brand-400">{entry.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {complaint.authorityFeed.length > 0 && (
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 dark:bg-white/8">
                <Building2 className="h-4 w-4 text-brand-500 dark:text-brand-300" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
                {t('detail.authorityFeed')}
              </p>
            </div>
            <div className="space-y-2.5">
              {complaint.authorityFeed.map((act) => (
                <div key={act.id} className="flex items-start gap-3 rounded-xl bg-brand-50/60 px-3 py-2.5 dark:bg-white/4">
                  <span className="text-lg">{KIND_ICONS[act.kind] ?? '📋'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-900 dark:text-white">
                      {act.actor} <span className="font-normal text-brand-400">· {act.time}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-brand-500 dark:text-brand-300">{act.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {complaint.evidence.length > 0 && (
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 dark:bg-white/8">
                <Paperclip className="h-4 w-4 text-brand-500 dark:text-brand-300" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
                {t('detail.evidence')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {complaint.evidence.map((ev) => {
                const img = complaint.aiAnalysis?.evidenceImages?.find((i) => i.id === ev.id)
                const thumb = img?.thumbUrl ?? img?.privacyUrl
                if (ev.type === 'image' && thumb) {
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setZoomImg(thumb)}
                      className="group relative flex flex-col items-start overflow-hidden rounded-xl border border-brand-200 bg-white dark:border-white/10 dark:bg-white/5"
                    >
                      <img
                        src={thumb}
                        alt={ev.name}
                        className="h-24 w-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-brand-600 dark:text-brand-200">
                        📷 {ev.name}
                      </span>
                      {img?.privacyUrl && (
                        <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-brand-950/70 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur">
                          <ShieldAlert className="h-2.5 w-2.5 text-emerald-civic" />
                        </span>
                      )}
                    </button>
                  )
                }
                return (
                  <span
                    key={ev.id}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
                  >
                    {ev.type === 'video' ? '🎬' : '📷'} {ev.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <Modal
          open={Boolean(zoomImg)}
          onClose={() => setZoomImg(null)}
          title={t('detail.evidence')}
          size="lg"
        >
          {zoomImg && (
            <div className="flex items-center justify-center">
              <img
                src={zoomImg}
                alt="Evidence"
                className="max-h-[70vh] w-auto rounded-2xl object-contain"
              />
            </div>
          )}
        </Modal>

        {complaint.resolution && (
          <TranslatorCard
            t={t}
            officialResponse={complaint.resolution.officialResponse}
            aiExplanation={complaint.resolution.aiExplanation}
          />
        )}

        {(resolved || disputed) && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 px-3.5 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-civic" />
              <div>
                <p className="text-xs font-bold text-brand-900 dark:text-white">
                  {disputed ? t('detail.disputedStatus') : t('detail.authorityResolved')}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-brand-500 dark:text-brand-300">
                  {disputed ? t('detail.disputedMsg') : t('detail.authorityResolvedMsg')}
                </p>
              </div>
            </div>
            {resolved && (
              <ResolutionVerification
                t={t}
                complaintId={complaint.id}
                onVerify={(answer) => onVerify(complaint.id, answer)}
                onAttachEvidence={(files) => onAttachEvidence(complaint.id, files)}
              />
            )}
          </div>
        )}

        <div className="rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/80 dark:bg-white/8">
              <MessageSquare className="h-4 w-4 text-brand-500 dark:text-brand-300" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
              {t('detail.comments')} ({complaint.comments.length})
            </p>
          </div>
          <div className="space-y-2.5">
            {complaint.comments.length === 0 && (
              <p className="text-[11px] text-brand-400">{t('detail.noComments')}</p>
            )}
            {complaint.comments.map((cm) => (
              <div key={cm.id} className="rounded-xl bg-brand-50/60 px-3 py-2.5 dark:bg-white/4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-100">
                    <ShieldAlert className="h-3 w-3 text-emerald-civic" />
                    {cm.author}
                  </p>
                  <span className="text-[10px] text-brand-400">{cm.time}</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-brand-600 dark:text-brand-200">{cm.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') postComment()
              }}
              placeholder={t('detail.addComment')}
              aria-label={t('detail.addComment')}
              className="flex-1 rounded-xl border border-brand-200 bg-white/80 px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-900/60 dark:text-brand-50 dark:placeholder:text-brand-500"
            />
            <button
              onClick={postComment}
              aria-label={t('detail.postComment')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white transition-colors hover:bg-brand-800 dark:bg-white dark:text-brand-900"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-brand-100 pt-4 dark:border-white/8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSupport(complaint.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all',
              isSupported
                ? 'border border-emerald-civic/30 bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic'
                : 'border border-emerald-civic/25 bg-emerald-civic/8 text-emerald-civic-deep hover:bg-emerald-civic/15 dark:text-emerald-civic',
            )}
          >
            <Heart className={cn('h-4 w-4', isSupported && 'fill-current')} />
            {isSupported ? t('feed.supported') : t('feed.facingToo')} · {complaint.support}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 py-2.5 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
          >
            <Lightbulb className="h-4 w-4 text-brand-400" />
            {t('common.close')}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}
