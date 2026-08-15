import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Clock3, Paperclip, RefreshCw, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'

interface ResolutionVerificationProps {
  t: (key: string) => string
  complaintId: string
  onVerify: (answer: 'yes' | 'partial' | 'no') => void
  onAttachEvidence: (files: File[]) => void
}

export function ResolutionVerification({
  t,
  complaintId,
  onVerify,
  onAttachEvidence,
}: ResolutionVerificationProps) {
  const [selected, setSelected] = useState<'yes' | 'partial' | 'no' | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (answer: 'yes' | 'partial' | 'no') => {
    setSelected(answer)
    if (answer === 'no') {
      window.setTimeout(() => inputRef.current?.click(), 250)
    } else {
      onVerify(answer)
      setSelected(null)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelected(null)
      return
    }
    setUploading(true)
    window.setTimeout(() => {
      onAttachEvidence(Array.from(files))
      onVerify('no')
      setUploading(false)
      setSelected(null)
    }, 900)
  }

  const options = [
    {
      value: 'yes' as const,
      label: t('tracker.verifiedYes'),
      icon: CheckCheck,
      color: 'text-emerald-civic',
      bg: 'hover:border-emerald-civic/50 hover:bg-emerald-civic/8',
    },
    {
      value: 'partial' as const,
      label: t('tracker.verifiedPartial'),
      icon: Clock3,
      color: 'text-amber-500',
      bg: 'hover:border-amber-500/50 hover:bg-amber-500/8',
    },
    {
      value: 'no' as const,
      label: t('tracker.verifiedNo'),
      icon: XCircle,
      color: 'text-red-500',
      bg: 'hover:border-red-500/50 hover:bg-red-500/8',
    },
  ]

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 dark:border-white/8 dark:bg-brand-800/40">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-civic/12">
          <RefreshCw className="h-4 w-4 text-emerald-civic-deep dark:text-emerald-civic" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
            {t('tracker.resolutionQ')}
          </p>
          <p className="font-mono text-[10px] text-brand-400">{complaintId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <motion.button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-xs font-semibold text-brand-600 transition-all dark:border-white/10 dark:bg-white/5 dark:text-brand-200 ${opt.bg}`}
            >
              {uploading && selected === opt.value ? (
                <motion.span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              ) : (
                <Icon className={`h-4 w-4 ${opt.color}`} />
              )}
              {opt.label}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected === 'no' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2 text-[11px] text-brand-400"
          >
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" />
              {t('tracker.addEvidence')}…
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
