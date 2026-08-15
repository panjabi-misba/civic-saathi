import { motion } from 'framer-motion'
import { ListChecks, MapPin, Plus, Share2, ShieldCheck, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SubmissionSuccessProps {
  t: (key: string) => string
  complaintId: string
  onTrack: () => void
  onNewReport: () => void
  onShare: () => void
}

const steps = [
  { key: 'stepReported', icon: MapPin },
  { key: 'stepVerified', icon: ShieldCheck },
  { key: 'stepAssigned', icon: UserCheck },
]

export function SubmissionSuccess({
  t,
  complaintId,
  onTrack,
  onNewReport,
  onShare,
}: SubmissionSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
    >
      <div className="relative px-6 pb-8 pt-10 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12), transparent 60%)',
          }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-civic text-white shadow-lg shadow-emerald-500/30"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="h-10 w-10"
            fill="none"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            />
          </motion.svg>
        </motion.div>

        <h2 className="relative font-display text-xl font-extrabold text-brand-900 dark:text-white">
          {t('success.heading')}
        </h2>
        <div className="relative mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-civic/25 bg-emerald-civic/8 px-4 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">
            {t('success.id')}
          </span>
          <span className="font-mono text-sm font-bold text-emerald-civic-deep dark:text-emerald-civic">
            {complaintId}
          </span>
        </div>

        <div className="relative mx-auto mt-8 flex max-w-sm items-center justify-between px-2">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-civic text-white shadow-md shadow-emerald-500/25"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span className="whitespace-nowrap text-[10px] font-semibold text-brand-500 dark:text-brand-300">
                    {t(`success.${step.key}`)}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.65 + i * 0.3, duration: 0.35 }}
                    className="mx-1 mb-5 h-0.5 flex-1 origin-left rounded-full bg-emerald-civic/50"
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="relative mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button variant="secondary" size="lg" onClick={onTrack}>
            <ListChecks className="h-4 w-4" />
            {t('success.track')}
          </Button>
          <Button variant="outline" size="lg" onClick={onNewReport}>
            <Plus className="h-4 w-4" />
            {t('success.newReport')}
          </Button>
          <Button variant="ghost" size="lg" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            {t('success.share')}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
