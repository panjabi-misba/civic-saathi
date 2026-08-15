import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { ViewKey } from '@/types/civic'
import { useAuth } from '@/hooks/useAuth'
import { useComplaints } from '@/hooks/useComplaints'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { useLocation } from '@/hooks/useLocation'
import { LANGUAGES } from '@/data/mockData'
import { civicLocationToArea } from '@/data/locations'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ToastViewport } from '@/components/ui/ToastViewport'
import { AuthScreen } from '@/components/Auth/AuthScreen'

const Reporter = lazy(() =>
  import('@/components/Reporter/Reporter').then((m) => ({ default: m.Reporter })),
)
const Tracker = lazy(() =>
  import('@/components/Tracker/Tracker').then((m) => ({ default: m.Tracker })),
)
const Heatmap = lazy(() =>
  import('@/components/Heatmap/Heatmap').then((m) => ({ default: m.Heatmap })),
)
const Assistant = lazy(() =>
  import('@/components/Assistant/Assistant').then((m) => ({ default: m.Assistant })),
)
const Overview = lazy(() =>
  import('@/pages/Overview').then((m) => ({ default: m.Overview })),
)
const Community = lazy(() =>
  import('@/pages/Community').then((m) => ({ default: m.Community })),
)

function LoadingFallback({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-brand-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-civic" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    </div>
  )
}

function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-civic/10 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-sky-500/8 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[300px] w-[420px] rounded-full bg-brand-500/8 blur-3xl" />
    </div>
  )
}

function App() {
  const [view, setView] = useState<ViewKey>('overview')
  const { profile, isAuthenticated, login, logout } = useAuth()
  const { complaints, addComplaint, updateResolution, addSupport, addComment, isSupported } =
    useComplaints()
  const { location } = useLocation()
  const { language, t, changeLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { toasts, dismiss, success, error, info } = useToast()

  const navigate = (next: ViewKey) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    logout()
    setView('overview')
    info(t('authToasts.loggedOut'), t('authToasts.loggedOutMsg'))
  }

  return (
    <div className="min-h-screen">
      <Background />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <AuthScreen
              t={t}
              language={language}
              onLanguageChange={(lang) => {
                changeLanguage(lang)
                success(t('toasts.language'))
              }}
              theme={theme}
              onToggleTheme={toggleTheme}
              onAuthenticated={login}
              toastSuccess={success}
              toastInfo={info}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Sidebar
              view={view}
              onNavigate={navigate}
              theme={theme}
              onToggleTheme={toggleTheme}
              language={language}
              onLanguageChange={(lang) => {
                changeLanguage(lang)
                success(t('toasts.language'))
              }}
              t={t}
              languages={LANGUAGES}
              profile={profile}
              onLogout={handleLogout}
            />

            <Topbar view={view} theme={theme} onToggleTheme={toggleTheme} t={t} />

            <main className="lg:pl-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={<LoadingFallback t={t} />}>
                    {view === 'report' && (
                      <Reporter
                        t={t}
                        complaints={complaints}
                        onSubmitted={addComplaint}
                        onSupportExisting={addSupport}
                        onTrack={() => navigate('myreports')}
                        toastSuccess={success}
                        toastError={error}
                        toastInfo={info}
                      />
                    )}
                    {view === 'overview' && (
                      <Overview
                        t={t}
                        complaints={complaints}
                        theme={theme}
                        isSupported={isSupported}
                        onSupport={addSupport}
                        onOpenComplaint={() => navigate('myreports')}
                        onReport={() => navigate('report')}
                        onViewAll={() => navigate('myreports')}
                        onAskAssistant={() => navigate('assistant')}
                      />
                    )}
                    {view === 'community' && (
                      <Community
                        t={t}
                        complaints={complaints}
                        isSupported={isSupported}
                        onSupport={addSupport}
                        onVerify={updateResolution}
                        onAttachEvidence={(id) => info(t('tracker.evidenceAdded'), id)}
                        onAddComment={(id, text) =>
                          addComment(id, text, profile?.name ? t('profile.name') : 'You')
                        }
                      />
                    )}
                    {view === 'myreports' && (
                      <Tracker
                        t={t}
                        complaints={complaints}
                        onSupport={addSupport}
                        onVerify={updateResolution}
                        onAttachEvidence={() => info(t('tracker.evidenceAdded'))}
                        toastSuccess={success}
                        toastInfo={info}
                      />
                    )}
                    {view === 'civicmap' && <Heatmap t={t} theme={theme} />}
                    {view === 'assistant' && (
                      <Assistant
                        t={t}
                        language={language}
                        complaints={complaints}
                        toastInfo={info}
                        area={civicLocationToArea(location)}
                      />
                    )}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </main>

            <MobileNav view={view} onNavigate={navigate} t={t} />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default App
