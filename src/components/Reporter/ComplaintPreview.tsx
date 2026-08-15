import { AnimatePresence, motion } from 'framer-motion'
import {
  Copy,
  Check,
  FileText,
  RefreshCw,
  Send,
  Pencil,
  FileX,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AnalysisResult } from '@/types/civic'
import { Button } from '@/components/ui/Button'

interface ComplaintPreviewProps {
  t: (key: string) => string
  analysis: AnalysisResult
  editing: boolean
  draftText: string
  onDraftChange: (text: string) => void
  onToggleEdit: () => void
  onRegenerate: () => void
  onCopy: () => void
  onSubmit: () => void
  onDelete: () => void
}

export function ComplaintPreview({
  t,
  analysis,
  editing,
  draftText,
  onDraftChange,
  onToggleEdit,
  onRegenerate,
  onCopy,
  onSubmit,
  onDelete,
}: ComplaintPreviewProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const tm = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(tm)
  }, [copied])

  const handleCopy = () => {
    onCopy()
    setCopied(true)
  }

  const content = editing ? draftText : analysis.generatedComplaint

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
      className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
    >
      <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4 dark:border-white/8">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-400" />
          <div>
            <h3 className="font-display text-sm font-bold text-brand-900 dark:text-white">
              {t('complaint.heading')}
            </h3>
            <p className="text-[11px] text-brand-400">{t('complaint.sub')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleEdit}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-white/10"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('complaint.edit')}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-white/10"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-civic" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? t('complaint.copied') : t('complaint.copy')}
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('complaint.regenerate')}
          </button>
          <button
            onClick={onDelete}
            aria-label={t('complaint.delete')}
            title={t('complaint.delete')}
            className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
          >
            <FileX className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.textarea
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              value={draftText}
              onChange={(e) => onDraftChange(e.target.value)}
              rows={7}
              aria-label={t('complaint.heading')}
              autoFocus
              className="w-full resize-y rounded-2xl border border-emerald-civic/40 bg-brand-50/50 p-4 text-sm leading-relaxed text-brand-900 focus:outline-none dark:bg-brand-800/50 dark:text-brand-50"
            />
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="whitespace-pre-wrap rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed text-brand-800 dark:border-white/8 dark:bg-white/3 dark:text-brand-100">
                {content}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-400">
                <span className="rounded-full bg-brand-100/70 px-2.5 py-1 font-medium dark:bg-white/8">
                  {analysis.category}
                </span>
                <span className="rounded-full bg-brand-100/70 px-2.5 py-1 font-medium dark:bg-white/8">
                  {analysis.department}
                </span>
                <span className="rounded-full bg-emerald-civic/10 px-2.5 py-1 font-semibold text-emerald-civic-deep dark:text-emerald-civic">
                  {analysis.estimatedPriority}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onSubmit}
          >
            <Send className="h-4 w-4" />
            {t('complaint.submit')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
