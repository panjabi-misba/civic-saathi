import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  t: (key: string) => string
}

export function TypingIndicator({ t }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2"
      aria-label={t('assistant.typing')}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-900 text-white">
        <svg viewBox="0 0 64 64" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M12 40 L20 24 L30 33 L42 21 L48 40 Z" fill="#10B981" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-brand-800/60">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-brand-400 dark:bg-brand-300"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
        <span className="ml-2 hidden text-[11px] font-medium text-brand-400 sm:block">
          {t('assistant.typing')}
        </span>
      </div>
    </motion.div>
  )
}
