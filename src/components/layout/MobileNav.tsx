import { motion } from 'framer-motion'
import type { ViewKey } from '@/types/civic'
import { NAV_ITEMS } from '@/components/layout/Sidebar'
import { cn } from '@/utils/cn'

interface MobileNavProps {
  view: ViewKey
  onNavigate: (view: ViewKey) => void
  t: (key: string) => string
}

export function MobileNav({ view, onNavigate, t }: MobileNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-200/70 bg-white/85 backdrop-blur-xl lg:hidden dark:border-white/8 dark:bg-brand-950/80"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const Icon = item.icon
          return (
            <motion.button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              whileTap={{ scale: 0.9 }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5',
                active ? 'text-emerald-civic-deep dark:text-emerald-civic' : 'text-brand-400',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-civic"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{t(`nav.short.${item.key}`)}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
