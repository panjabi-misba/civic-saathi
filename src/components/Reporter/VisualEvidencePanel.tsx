import { motion } from 'framer-motion'
import { ScanSearch, ShieldCheck, Cpu } from 'lucide-react'
import type { DetectedObject, MediaItem } from '@/types/civic'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface VisualEvidencePanelProps {
  t: (key: string) => string
  image?: MediaItem
  detectedObjects: DetectedObject[]
  detectedFactors: string[]
  privacyApplied?: boolean
  fallbackUsed?: boolean
  evidenceMatch?: number
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return 'bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic'
  if (c >= 0.6) return 'bg-amber-500/12 text-amber-600 dark:text-amber-400'
  return 'bg-brand-100 text-brand-500 dark:bg-white/8 dark:text-brand-300'
}

export function VisualEvidencePanel({
  t,
  image,
  detectedObjects,
  detectedFactors,
  privacyApplied,
  fallbackUsed,
  evidenceMatch,
}: VisualEvidencePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
      className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
    >
      <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4 dark:border-white/8">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-emerald-civic-deep dark:text-emerald-civic" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-900 dark:text-white">
            {t('vision.evidencePanel')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {fallbackUsed && (
            <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
              <Cpu className="h-3 w-3" />
              {t('vision.localEngine')}
            </span>
          )}
          {privacyApplied && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-civic/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-civic-deep dark:text-emerald-civic">
              <ShieldCheck className="h-3 w-3" />
              {t('vision.privacyApplied')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[220px_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 dark:border-white/8 dark:bg-white/4">
          {image?.previewUrl ? (
            <img
              src={image.previewUrl}
              alt={image.name}
              className="h-full max-h-56 w-full object-cover sm:max-h-none"
            />
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center text-brand-300">
              {t('vision.noImage')}
            </div>
          )}
          {privacyApplied && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-brand-950/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <ShieldCheck className="h-3 w-3 text-emerald-civic" />
              {t('vision.privacyBadge')}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {detectedObjects.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
                {t('vision.detectedObjects')}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detectedObjects.map((obj) => (
                  <div
                    key={obj.label}
                    className="flex items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 dark:border-white/8 dark:bg-white/4"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-100">
                      <span className="text-base">{obj.emoji}</span>
                      {obj.label}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        confidenceColor(obj.confidence),
                      )}
                    >
                      {Math.round(obj.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-brand-400">{t('vision.noBoxes')}</p>
            </div>
          )}

          {detectedFactors.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
                {t('vision.aiDetected')}
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedFactors.map((f) => (
                  <Badge key={f} bg="rgba(16,185,129,0.1)" color="#059669">
                    ✓ {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {evidenceMatch != null && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 dark:border-white/8 dark:bg-white/4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-brand-500 dark:text-brand-300">
                  {t('vision.evidenceMatch')}
                </span>
                <span className="font-display font-extrabold text-emerald-civic-deep dark:text-emerald-civic">
                  {evidenceMatch}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${evidenceMatch}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-civic to-emerald-civic-deep"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-brand-400">{t('vision.matchNote')}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
