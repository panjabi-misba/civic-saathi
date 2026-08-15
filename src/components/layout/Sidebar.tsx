import { motion } from 'framer-motion'
import {
  Mic,
  ListChecks,
  Activity,
  Bot,
  Moon,
  Sun,
  Languages,
  Check,
  ChevronDown,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CitizenProfile, Language, ThemeMode, ViewKey } from '@/types/civic'
import { CivicLogo } from '@/components/CivicLogo'
import { cn } from '@/utils/cn'
import { LogOut } from 'lucide-react'

export interface NavItem {
  key: ViewKey
  label: string
  desc: string
  icon: typeof Mic
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', desc: 'Civic command center', icon: LayoutDashboard },
  { key: 'report', label: 'AI Reporter', desc: 'Report & analyse', icon: Mic },
  { key: 'myreports', label: 'My Reports', desc: 'Follow complaints', icon: ListChecks },
  { key: 'civicmap', label: 'City Signals', desc: 'Community heatmap', icon: Activity },
  { key: 'community', label: 'Local Feed', desc: 'Community activity', icon: Users },
  { key: 'assistant', label: 'AI Assistant', desc: 'Ask anything', icon: Bot },
]

interface SidebarProps {
  view: ViewKey
  onNavigate: (view: ViewKey) => void
  theme: ThemeMode
  onToggleTheme: () => void
  language: Language
  onLanguageChange: (lang: Language) => void
  t: (key: string) => string
  languages: { code: Language; label: string; native: string }[]
  profile: CitizenProfile | null
  onLogout: () => void
}

export function Sidebar({
  view,
  onNavigate,
  theme,
  onToggleTheme,
  language,
  onLanguageChange,
  t,
  languages,
  profile,
  onLogout,
}: SidebarProps) {
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-brand-200/70 bg-white/70 backdrop-blur-xl lg:flex dark:border-white/8 dark:bg-brand-950/60">
      <div className="flex h-16 items-center border-b border-brand-100 px-5 dark:border-white/8">
        <CivicLogo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-400">
          {t('common.demo')} · Mumbai
        </p>
        {NAV_ITEMS.map((item) => {
          const active = view === item.key
          const Icon = item.icon
          return (
            <motion.button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              whileTap={{ scale: 0.98 }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                active
                  ? 'bg-brand-900 text-white shadow-sm dark:bg-white dark:text-brand-900'
                  : 'text-brand-600 hover:bg-brand-100/80 dark:text-brand-300 dark:hover:bg-white/8',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-white/15 text-white dark:bg-brand-900/10 dark:text-brand-900'
                    : 'bg-brand-100/80 text-brand-500 group-hover:bg-white group-hover:text-brand-700 dark:bg-white/8 dark:text-brand-300',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                <span
                  className={cn(
                    'block truncate text-[11px]',
                    active
                      ? 'text-white/60 dark:text-brand-900/60'
                      : 'text-brand-400 dark:text-brand-400',
                  )}
                >
                  {item.desc}
                </span>
              </span>
              {active && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="h-1.5 w-1.5 rounded-full bg-emerald-civic"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-brand-100 p-4 dark:border-white/8">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            className="flex w-full items-center justify-between rounded-xl border border-brand-200 bg-white/70 px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-100 dark:hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-brand-400" />
              {t('langs.label')}: {languages.find((l) => l.code === language)?.native}
            </span>
            <ChevronDown
              className={cn('h-4 w-4 text-brand-400 transition-transform', langOpen && 'rotate-180')}
            />
          </button>
          {langOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              role="listbox"
              className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-lift dark:border-white/12 dark:bg-brand-800"
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  role="option"
                  aria-selected={language === l.code}
                  onClick={() => {
                    onLanguageChange(l.code)
                    setLangOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors',
                    language === l.code
                      ? 'bg-emerald-civic/10 font-semibold text-emerald-civic-deep dark:text-emerald-civic'
                      : 'text-brand-600 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-white/8',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{l.native}</span>
                    <span className="text-[11px] text-brand-400">{l.label}</span>
                  </span>
                  {language === l.code && <Check className="h-4 w-4" />}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <button
          onClick={onToggleTheme}
          className="flex w-full items-center justify-between rounded-xl border border-brand-200 bg-white/70 px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-100 dark:hover:bg-white/10"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-brand-500" />
            )}
            {theme === 'dark' ? t('theme.dark') : t('theme.light')}
          </span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-2.5 dark:border-white/8 dark:bg-white/4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-civic/15 text-sm font-bold text-emerald-civic-deep dark:text-emerald-civic">
            {profile ? profile.name.charAt(0).toUpperCase() : t('profile.initial')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-800 dark:text-brand-100">
              {profile ? profile.name : t('profile.name')}
            </p>
            <p className="truncate text-[11px] text-brand-400">
              {profile ? `${t('profile.verified')} · ${profile.ward}` : t('profile.role')}
            </p>
          </div>
          <button
            onClick={onLogout}
            title={t('profile.logout')}
            aria-label={t('profile.logout')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-400 transition-colors hover:bg-brand-100 hover:text-red-500 dark:hover:bg-white/8 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
