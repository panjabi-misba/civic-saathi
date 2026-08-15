import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  icon?: React.ReactNode
  color?: string
}

export function Switch({ checked, onChange, label, description, icon, color = 'bg-emerald-civic' }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white/70 px-4 py-3.5 text-left transition-colors hover:border-brand-200 dark:border-white/10 dark:bg-white/4 dark:hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', checked ? 'bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic' : 'bg-brand-100/80 text-brand-400 dark:bg-white/8')}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-800 dark:text-brand-100">{label}</p>
          {description && <p className="text-[11px] text-brand-400">{description}</p>}
        </div>
      </div>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? color : 'bg-brand-200 dark:bg-white/15',
        )}
      >
        <motion.span
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </span>
    </button>
  )
}
