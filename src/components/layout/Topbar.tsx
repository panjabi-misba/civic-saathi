import { motion } from 'framer-motion'
import { Moon, Sun, ShieldCheck } from 'lucide-react'
import type { ThemeMode, ViewKey } from '@/types/civic'
import { CivicLogo } from '@/components/CivicLogo'
import { NAV_ITEMS } from '@/components/layout/Sidebar'

interface TopbarProps {
  view: ViewKey
  theme: ThemeMode
  onToggleTheme: () => void
  t: (key: string) => string
}

export function Topbar({ view, theme, onToggleTheme, t }: TopbarProps) {
  const current = NAV_ITEMS.find((n) => n.key === view)
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-brand-200/70 bg-white/80 px-4 backdrop-blur-xl lg:hidden dark:border-white/8 dark:bg-brand-950/70"
    >
      <div className="flex items-center gap-3">
        <CivicLogo compact showWordmark />
        <span className="hidden h-4 w-px bg-brand-200 sm:block dark:bg-white/10" />
        <span className="hidden text-sm font-semibold text-brand-600 sm:block dark:text-brand-200">
          {current?.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-civic/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-civic-deep sm:flex dark:text-emerald-civic">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('app.privacy')}
        </span>
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-200 bg-white/70 text-brand-500 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.header>
  )
}
