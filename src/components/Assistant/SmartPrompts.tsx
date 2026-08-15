import { motion } from 'framer-motion'
import { ArrowUpRight, Lightbulb } from 'lucide-react'

interface SmartPromptsProps {
  t: (key: string) => string
  prompts: string[]
  onSelect: (prompt: string) => void
}

export function SmartPrompts({ t, prompts, onSelect }: SmartPromptsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic">
          <Lightbulb className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-400">
          {t('assistant.suggested')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, i) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            onClick={() => onSelect(prompt)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-1.5 rounded-xl border border-brand-200/80 bg-white/80 px-3 py-2 text-left text-xs font-semibold text-brand-600 shadow-sm backdrop-blur transition-colors hover:border-emerald-civic/40 hover:bg-emerald-civic/6 hover:text-emerald-civic-deep dark:border-white/12 dark:bg-white/6 dark:text-brand-200 dark:hover:text-emerald-civic"
          >
            {prompt}
            <ArrowUpRight className="h-3 w-3 shrink-0 text-brand-400 transition-colors group-hover:text-emerald-civic" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
