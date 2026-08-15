import { motion } from 'framer-motion'
import { BrainCircuit, Check, Loader2, ScanSearch, Cpu } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AnalysisResult } from '@/types/civic'
import { cn } from '@/utils/cn'

interface AIProcessingProps {
  t: (key: string) => string
  hasImage: boolean
  onAnalyze: () => Promise<AnalysisResult>
  onComplete: (analysis: AnalysisResult) => void
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

export function AIProcessing({ t, hasImage, onAnalyze, onComplete }: AIProcessingProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [complete, setComplete] = useState(false)
  const [fallback, setFallback] = useState(false)
  const resultRef = useRef<AnalysisResult | null>(null)
  const completedRef = useRef(false)

  const steps = useMemo(() => {
    const all = [
      hasImage ? 'vision.s1' : null,
      'vision.s2',
      'vision.s3',
      'vision.s4',
      'vision.s5',
      'vision.s6',
    ].filter((k): k is string => k !== null)
    return all
  }, [hasImage])

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: 12 + Math.random() * 76,
        y: 12 + Math.random() * 76,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 2.4,
      })),
    [],
  )

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []

    const finish = () => {
      if (cancelled || completedRef.current) return
      completedRef.current = true
      setComplete(true)
      timers.push(
        window.setTimeout(() => {
          if (resultRef.current) onComplete(resultRef.current)
        }, 450),
      )
    }

    // Run the real multimodal analysis immediately (image-derived + text merge).
    onAnalyze()
      .then((res) => {
        if (cancelled) return
        resultRef.current = res
        if (res.fallbackUsed) setFallback(true)
      })
      .catch(() => {
        // Analysis must never crash the app.
        completedRef.current = true
        setFallback(true)
        setComplete(true)
      })

    const stepTime = 560
    steps.forEach((_, i) => {
      timers.push(window.setTimeout(() => setActiveStep(i), i * stepTime))
    })
    const minEnd = steps.length * stepTime + 420
    timers.push(window.setTimeout(() => finish(), minEnd))

    // Safety: never block the UI even if analysis hangs.
    timers.push(window.setTimeout(() => finish(), 9000))

    return () => {
      cancelled = true
      timers.forEach((tm) => window.clearTimeout(tm))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative overflow-hidden rounded-3xl glass p-8 shadow-lift">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 15% 15%, rgba(16,185,129,0.12), transparent 42%), radial-gradient(circle at 85% 70%, rgba(59,130,246,0.1), transparent 42%), radial-gradient(circle at 60% 30%, rgba(139,92,246,0.08), transparent 40%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-emerald-civic/40"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [0.6, 1.4, 0.6],
              y: [0, -14, 0],
            }}
            transition={{
              delay: p.delay,
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {!complete && (
        <motion.div
          className="pointer-events-none absolute inset-x-10 h-px bg-gradient-to-r from-transparent via-emerald-civic to-transparent"
          animate={{ top: ['8%', '92%', '8%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-5">
          <motion.div
            className="absolute -inset-4 rounded-full"
            animate={{
              scale: complete ? [1, 1.35, 1] : [1, 1.18, 1],
              opacity: complete ? [0.35, 0, 0.35] : [0.4, 0, 0.4],
            }}
            transition={{ duration: complete ? 1.6 : 2.4, repeat: Infinity }}
            style={{ background: 'rgba(16,185,129,0.25)' }}
          />
          <motion.div
            animate={complete ? { rotate: 0, scale: [1, 1.15, 1] } : { rotate: 360 }}
            transition={
              complete
                ? { duration: 0.5 }
                : { duration: 3.2, repeat: Infinity, ease: 'linear' }
            }
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg backdrop-blur',
              complete
                ? 'bg-emerald-civic'
                : 'border border-white/20 bg-gradient-to-br from-brand-800/90 to-brand-900/90',
            )}
          >
            {complete ? (
              <motion.svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-white"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45 }}
                fill="none"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            ) : hasImage ? (
              <ScanSearch className="h-8 w-8 text-emerald-civic" />
            ) : (
              <BrainCircuit className="h-8 w-8 text-emerald-civic" />
            )}
          </motion.div>
        </div>

        <h3 className="font-display text-lg font-bold text-brand-900 dark:text-white">
          {complete
            ? t('vision.engineDone')
            : hasImage
              ? t('vision.engineHeading')
              : t('processing.heading')}
        </h3>
        <p className="mt-1 text-sm text-brand-400">
          {complete ? t('vision.engineDoneSub') : t('processing.sub')}
        </p>

        {fallback && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            <Cpu className="h-3 w-3" />
            {t('vision.localEngine')} · {t('vision.visionFallback')}
          </span>
        )}

        <div className="mt-7 w-full max-w-sm space-y-2.5 text-left">
          {steps.map((key, i) => {
            const state =
              i < activeStep || complete ? 'done' : i === activeStep ? 'active' : 'pending'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 backdrop-blur transition-all duration-300',
                  state === 'done' && 'border-emerald-civic/25 bg-emerald-civic/8',
                  state === 'active' &&
                    'border-emerald-civic/45 bg-emerald-civic/12 shadow-sm',
                  state === 'pending' &&
                    'border-brand-100/80 bg-brand-50/50 dark:border-white/10 dark:bg-white/4',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                    state === 'done' && 'bg-emerald-civic text-white',
                    state === 'active' && 'bg-emerald-civic/15 text-emerald-civic-deep dark:text-emerald-civic',
                    state === 'pending' && 'bg-brand-100 text-brand-400 dark:bg-white/10',
                  )}
                >
                  {state === 'done' ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.span>
                  ) : state === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div className="flex-1">
                  <p
                    className={cn(
                      'flex items-center gap-1.5 text-[13px] font-semibold transition-colors',
                      state === 'pending' && 'text-brand-400',
                      state === 'active' && 'text-brand-900 dark:text-white',
                      state === 'done' && 'text-emerald-civic-deep dark:text-emerald-civic',
                    )}
                  >
                    {t(key)}
                    {state === 'active' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-civic/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-civic-deep dark:text-emerald-civic">
                        {t('vision.scanning')}
                      </span>
                    )}
                    {state === 'done' && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-civic-deep dark:text-emerald-civic">
                        ✓ {t('vision.complete')}
                      </span>
                    )}
                  </p>
                  {state === 'active' && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-civic to-emerald-civic-deep"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '60%' }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
