import { AnimatePresence, motion } from 'framer-motion'
import {
  AtSign,
  ChevronLeft,
  Fingerprint,
  Globe,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
  UserRoundPlus,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CitizenProfile, Language, ThemeMode } from '@/types/civic'
import { CivicLogo } from '@/components/CivicLogo'
import { OtpInput } from '@/components/Auth/OtpInput'
import { LANGUAGES, CIVIC_AREAS } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface AuthScreenProps {
  t: (key: string) => string
  language: Language
  onLanguageChange: (lang: Language) => void
  theme: ThemeMode
  onToggleTheme: () => void
  onAuthenticated: (profile: CitizenProfile) => void
  toastSuccess: (title: string, message?: string) => void
  toastInfo: (title: string, message?: string) => void
}

type Mode = 'login' | 'signup'
type Method = 'email' | 'citizen'
type Step = 'form' | 'otp' | 'done'

const WARDS = [
  'Ward A',
  'Ward B',
  'Ward C',
  'Ward D',
  'Ward E',
  'Ward F',
  'Ward G',
  'Ward H',
  'Ward K (East)',
  'Ward K (West)',
]

const DEMO_OTP = '123456'

function generateCitizenId(): string {
  const year = new Date().getFullYear()
  return `CIT-${year}-${Math.floor(10000 + Math.random() * 89999)}`
}

function titleCaseName(localPart: string): string {
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 40)
}

export function AuthScreen({
  t,
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  onAuthenticated,
  toastSuccess,
  toastInfo,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [method, setMethod] = useState<Method>('email')
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [citizenId, setCitizenId] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const useCitizenMethod = mode === 'login' && method === 'citizen'

  useEffect(() => {
    if (countdown <= 0) return
    const tm = window.setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => window.clearTimeout(tm)
  }, [countdown])

  const resetOtp = useCallback(() => {
    setOtp(Array(6).fill(''))
    setError('')
  }, [])

  const switchMode = (next: Mode) => {
    setMode(next)
    setStep('form')
    resetOtp()
    setError('')
  }

  const switchMethod = (next: Method) => {
    setMethod(next)
    resetOtp()
    setError('')
  }

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSendOtp = () => {
    if (!validateEmail(email)) {
      setError(t('auth.invalidEmail'))
      return
    }
    setError('')
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setStep('otp')
      setCountdown(30)
      toastInfo(t('auth.otpSent'), `${t('auth.otpSent')} ${email}`)
      setError('')
    }, 900)
  }

  const handleVerifyOtp = () => {
    const code = otp.join('')
    if (code.length < 6) {
      setError(t('auth.invalidOtp'))
      return
    }
    setLoading(true)
    setError('')
    window.setTimeout(() => authenticate(), 700)
  }

  const handleCitizenLogin = () => {
    const valid = /^CIT-\d{4}-\d{4,5}$/i.test(citizenId.trim())
    if (!valid) {
      setError(t('auth.invalidCitizenId'))
      return
    }
    setError('')
    setLoading(true)
    window.setTimeout(() => {
      toastSuccess(t('auth.citizenFound'), citizenId.trim().toUpperCase())
      authenticate()
    }, 900)
  }

  const handleSignup = () => {
    if (!name.trim()) {
      setError(t('auth.invalidName'))
      return
    }
    if (!validateEmail(email)) {
      setError(t('auth.invalidEmail'))
      return
    }
    setError('')
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setStep('otp')
      setCountdown(30)
      toastInfo(t('auth.otpSent'), `${t('auth.otpSent')} ${email}`)
    }, 900)
  }

  const authenticate = () => {
    const resolvedName =
      mode === 'signup' ? name.trim() : useCitizenMethod ? citizenId.trim().toUpperCase() : titleCaseName(email.split('@')[0])
    const defaultArea = CIVIC_AREAS[0]
    const profile: CitizenProfile = {
      name: resolvedName,
      email: useCitizenMethod ? `citizen@${citizenId.trim().toLowerCase().replace(/-/g, '')}.mumbai.in` : email.toLowerCase(),
      citizenId: useCitizenMethod ? citizenId.trim().toUpperCase() : generateCitizenId(),
      ward: WARDS[Math.floor(Math.random() * WARDS.length)],
      area: defaultArea.name,
      city: defaultArea.city,
      pincode: defaultArea.pincode,
      joinedAt: new Date().toISOString().slice(0, 10),
      privacy: {
        blurFaces: true,
        blurPlates: true,
        hideName: true,
        approximateLocation: true,
        showNamePublic: false,
      },
      civicStats: {
        reportsSubmitted: 0,
        issuesResolved: 0,
        communitySignals: 0,
        issuesSupported: 0,
        level: 'Citizen',
      },
    }
    setStep('done')
    window.setTimeout(() => {
      onAuthenticated(profile)
      if (mode === 'signup') {
        toastSuccess(t('authToasts.signedUp'), t('authToasts.signedUpMsg'))
      } else {
        toastSuccess(t('authToasts.loggedIn'), t('authToasts.loggedInMsg'))
      }
    }, 1200)
  }

  const stepIndex = step === 'form' ? 0 : step === 'otp' ? 1 : 2

  const featurePills = useMemo(
    () => [
      { key: 'app.online', icon: Smartphone },
      { key: 'app.multilingual', icon: Globe },
      { key: 'app.privacy', icon: Lock },
    ],
    [],
  )

  const header = (
    <div className="flex items-center justify-between">
      <CivicLogo />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-xl border border-brand-200 bg-white/70 p-1 dark:border-white/12 dark:bg-white/5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onLanguageChange(l.code)}
              aria-pressed={language === l.code}
              className={cn(
                'rounded-lg px-2 py-1 text-[11px] font-bold transition-all',
                language === l.code
                  ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                  : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
              )}
            >
              {l.native}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand-200 bg-white/70 text-brand-500 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )

  const steps = [t('auth.steps.form'), t('auth.steps.otp'), t('auth.steps.done')]

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-civic/12 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-[380px] w-[380px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[420px] rounded-full bg-brand-500/8 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        {header}

        <div className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-10 lg:mt-10">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="hidden flex-1 lg:block"
          >
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl font-extrabold leading-tight xl:text-5xl"
            >
              <span className="text-gradient-civic">{t('app.tagline')}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-500 dark:text-brand-300"
            >
              {t('app.sub')}
            </motion.p>
            <div className="mt-6 flex flex-wrap gap-2">
              {featurePills.map((pill, i) => {
                const Icon = pill.icon
                return (
                  <motion.span
                    key={pill.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + i * 0.06 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
                  >
                    <Icon className="h-3.5 w-3.5 text-emerald-civic" />
                    {t(pill.key)}
                  </motion.span>
                )
              })}
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-civic/20 bg-emerald-civic/6 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="text-[13px] leading-relaxed text-brand-600 dark:text-brand-200">
                {t('auth.secureNote')}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            className="w-full max-w-md"
          >
            <div className="glass-card overflow-hidden rounded-3xl">
              <div className="border-b border-brand-100 px-6 pb-5 pt-6 dark:border-white/10">
                <h2 className="font-display text-xl font-extrabold text-brand-900 dark:text-white">
                  {mode === 'login' ? t('auth.welcomeBack') : t('auth.welcome')}
                </h2>
                <p className="mt-1 text-[13px] text-brand-400">
                  {mode === 'login' ? t('auth.loginSub') : t('auth.signupSub')}
                </p>

                <div className="mt-4 flex items-center gap-0.5">
                  {steps.map((label, i) => (
                    <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                      <motion.div
                        animate={{
                          backgroundColor: i <= stepIndex ? '#10B981' : 'rgba(148,163,184,0.2)',
                        }}
                        className="h-1 w-full rounded-full"
                      />
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          i === stepIndex
                            ? 'text-emerald-civic-deep dark:text-emerald-civic'
                            : i < stepIndex
                              ? 'text-brand-400'
                              : 'text-brand-300 dark:text-brand-500',
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.div
                      key={`form-${mode}-${method}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-brand-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
                        {(['login', 'signup'] as Mode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => switchMode(m)}
                            aria-pressed={mode === m}
                            className={cn(
                              'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all',
                              mode === m
                                ? 'bg-brand-900 text-white shadow-sm dark:bg-white dark:text-brand-900'
                                : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
                            )}
                          >
                            {m === 'login' ? (
                              <LogIn className="h-4 w-4" />
                            ) : (
                              <UserRoundPlus className="h-4 w-4" />
                            )}
                            {m === 'login' ? t('auth.login') : t('auth.signup')}
                          </button>
                        ))}
                      </div>

                      {mode === 'login' && (
                        <div className="flex items-center gap-1 rounded-xl border border-brand-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
                          {(
                            [
                              { key: 'email', label: t('auth.email'), icon: Mail },
                              { key: 'citizen', label: t('auth.citizenId'), icon: Fingerprint },
                            ] as const
                          ).map((opt) => {
                            const Icon = opt.icon
                            return (
                              <button
                                key={opt.key}
                                onClick={() => switchMethod(opt.key)}
                                aria-pressed={method === opt.key}
                                className={cn(
                                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all',
                                  method === opt.key
                                    ? 'bg-emerald-civic text-white shadow-sm dark:bg-emerald-civic'
                                    : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {mode === 'signup' && (
                        <Field
                          label={t('auth.name')}
                          icon={<UserRound className="h-4 w-4" />}
                          input={
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={t('auth.namePlaceholder')}
                              autoComplete="name"
                              className="input-civic"
                            />
                          }
                        />
                      )}

                      {!useCitizenMethod ? (
                        <Field
                          label={t('auth.email')}
                          icon={<AtSign className="h-4 w-4" />}
                          input={
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={t('auth.emailPlaceholder')}
                              autoComplete="email"
                              className="input-civic"
                            />
                          }
                        />
                      ) : (
                        <Field
                          label={t('auth.citizenId')}
                          icon={<Fingerprint className="h-4 w-4" />}
                          input={
                            <input
                              type="text"
                              value={citizenId}
                              onChange={(e) => setCitizenId(e.target.value)}
                              placeholder={t('auth.citizenIdPlaceholder')}
                              autoComplete="off"
                              className="input-civic font-mono"
                            />
                          }
                        />
                      )}

                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden text-xs font-semibold text-red-500"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        onClick={() => {
                          if (useCitizenMethod) handleCitizenLogin()
                          else if (mode === 'login') handleSendOtp()
                          else handleSignup()
                        }}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-civic text-sm font-bold text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-civic-deep disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : useCitizenMethod ? (
                          <>
                            <Fingerprint className="h-4 w-4" />
                            {t('auth.citizenIdLogin')}
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            {t('auth.sendOtp')}
                          </>
                        )}
                      </motion.button>

                      <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-2.5 text-center dark:border-white/8 dark:bg-white/4">
                        <p className="text-[11px] leading-relaxed text-brand-400">
                          {mode === 'login' ? t('auth.switchToSignup') : t('auth.switchToLogin')}{' '}
                          <button
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            className="font-bold text-emerald-civic-deep underline-offset-2 hover:underline dark:text-emerald-civic"
                          >
                            {mode === 'login' ? t('auth.signup') : t('auth.login')}
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {step === 'otp' && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <button
                        onClick={() => {
                          setStep('form')
                          resetOtp()
                        }}
                        className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('auth.back')}
                      </button>

                      <div className="text-center">
                        <motion.span
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic"
                        >
                          <Smartphone className="h-7 w-7" />
                        </motion.span>
                        <h3 className="font-display text-lg font-bold text-brand-900 dark:text-white">
                          {t('auth.steps.otp')}
                        </h3>
                        <p className="mt-1 text-[13px] text-brand-400">
                          {t('auth.otpLabel')}{' '}
                          <span className="font-semibold text-brand-600 dark:text-brand-200">
                            {useCitizenMethod ? citizenId : email}
                          </span>
                        </p>
                      </div>

                      <OtpInput
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                        autoFocus
                        onComplete={handleVerifyOtp}
                      />

                      <div className="rounded-xl border border-emerald-civic/20 bg-emerald-civic/6 px-3.5 py-2.5">
                        <p className="text-center text-[11px] text-brand-500 dark:text-brand-300">
                          {t('auth.demoOtpHint')}{' '}
                          <button
                            onClick={() => setOtp(DEMO_OTP.split(''))}
                            className="font-mono font-bold text-emerald-civic-deep dark:text-emerald-civic"
                          >
                            {DEMO_OTP}
                          </button>
                        </p>
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden text-xs font-semibold text-red-500"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || otp.join('').length < 6}
                        onClick={handleVerifyOtp}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-civic text-sm font-bold text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-civic-deep disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            {t('auth.verifyOtp')}
                          </>
                        )}
                      </motion.button>

                      <div className="flex items-center justify-center gap-2 text-[11px] text-brand-400">
                        {countdown > 0 ? (
                          <span>{t('auth.resendIn').replace('{s}', String(countdown))}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setCountdown(30)
                              toastInfo(t('authToasts.otpSent'))
                            }}
                            className="font-bold text-emerald-civic-deep underline-offset-2 hover:underline dark:text-emerald-civic"
                          >
                            {t('auth.resend')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {step === 'done' && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-civic text-white shadow-lg shadow-emerald-500/30"
                      >
                        <motion.svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
                          <motion.path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </motion.svg>
                      </motion.div>
                      <h3 className="font-display text-lg font-bold text-brand-900 dark:text-white">
                        {t('auth.steps.done')}
                      </h3>
                      <p className="mt-1 text-[13px] text-brand-400">{t('common.loading')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-center gap-1.5 border-t border-brand-100 px-6 py-3.5 dark:border-white/10">
                <Lock className="h-3 w-3 text-brand-400" />
                <p className="text-[10px] text-brand-400">{t('auth.secureNote')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  icon: React.ReactNode
  input: React.ReactNode
}

function Field({ label, icon, input }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
        {icon}
        {label}
      </span>
      {input}
    </label>
  )
}
