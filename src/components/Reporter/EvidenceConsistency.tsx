import { motion } from 'framer-motion'
import { AlertTriangle, Check, ChevronRight, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import type { Category } from '@/types/civic'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface EvidenceConsistencyProps {
  t: (key: string) => string
  open: boolean
  match: number
  detectedIssue: string
  reportedText: string
  mismatch: boolean
  onCorrect: (category: Category) => void
  onContinue: () => void
  onClose: () => void
}

const CATEGORIES: Category[] = [
  'Sanitation',
  'Roads & Infrastructure',
  'Street Lighting',
  'Water Supply',
  'Drainage',
  'Pollution',
  'Traffic Signal',
  'Public Health',
  'Other',
]

export function EvidenceConsistency({
  t,
  open,
  match,
  detectedIssue,
  reportedText,
  mismatch,
  onCorrect,
  onContinue,
  onClose,
}: EvidenceConsistencyProps) {
  const [picking, setPicking] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title={t('vision.consistencyTitle')} size="md">
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 dark:border-white/8 dark:bg-white/4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-brand-500 dark:text-brand-300">
              <ScanSearch className="h-3.5 w-3.5 text-emerald-civic" />
              {t('vision.evidenceMatch')}
            </span>
            <span className="font-display text-xl font-extrabold text-emerald-civic-deep dark:text-emerald-civic">
              {match}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${match}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                mismatch ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-civic to-emerald-civic-deep',
              )}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-brand-500 dark:text-brand-300">
            {t('vision.matchNote')}
          </p>
        </div>

        {mismatch ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-brand-900 dark:text-white">
                {t('vision.mismatchTitle')}
              </p>
              <p className="text-[12px] leading-relaxed text-brand-600 dark:text-brand-200">
                {t('vision.mismatchBody')
                  .replace('{issue}', detectedIssue)
                  .replace('{text}', reportedText.slice(0, 120))}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-civic/25 bg-emerald-civic/8 p-4">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-civic" />
            <div>
              <p className="text-sm font-bold text-brand-900 dark:text-white">
                {t('vision.consistentTitle')}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-600 dark:text-brand-200">
                {t('vision.consistentBody').replace('{issue}', detectedIssue)}
              </p>
            </div>
          </div>
        )}

        {!picking && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {mismatch && (
              <button
                onClick={() => setPicking(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
              >
                {t('vision.correctCategory')}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onContinue}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors',
                mismatch
                  ? 'bg-brand-900 text-white hover:bg-brand-800 dark:bg-white dark:text-brand-900'
                  : 'bg-emerald-civic text-white hover:bg-emerald-civic-deep',
              )}
            >
              {mismatch ? t('vision.continueAnyway') : t('vision.continue')}
            </button>
          </div>
        )}

        {picking && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
              {t('vision.pickCategory')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onCorrect(cat)
                    setPicking(false)
                  }}
                  className="rounded-xl border border-brand-200 bg-white/70 px-3 py-2.5 text-left text-xs font-semibold text-brand-700 transition-colors hover:border-emerald-civic/40 hover:bg-emerald-civic/6 hover:text-emerald-civic-deep dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPicking(false)}
              className="mt-3 text-[11px] font-semibold text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
            >
              ← {t('common.cancel')}
            </button>
          </div>
        )}

        {!mismatch && detectedIssue && (
          <div className="flex items-center gap-2">
            <Badge bg="rgba(16,185,129,0.12)" color="#059669">
              {detectedIssue}
            </Badge>
            <span className="text-[11px] text-brand-400">{t('vision.detectedNote')}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
