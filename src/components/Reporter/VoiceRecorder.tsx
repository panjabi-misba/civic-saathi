import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Square, RotateCcw, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { mockSpeechToText } from '@/utils/civicAI'

interface VoiceRecorderProps {
  t: (key: string) => string
  onTranscribed: (text: string) => void
  disabled?: boolean
}

type RecState = 'idle' | 'recording' | 'processing'

const BAR_COUNT = 28

export function VoiceRecorder({ t, onTranscribed, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecState>('idle')
  const [activeBar, setActiveBar] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = () => {
    if (disabled) return
    setState('recording')
    setActiveBar(0)
    timerRef.current = window.setInterval(() => {
      setActiveBar((a) => (a + 1) % (BAR_COUNT * 2))
    }, 130)
  }

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState('processing')
    window.setTimeout(() => {
      onTranscribed(mockSpeechToText('voice sample describing the issue'))
      setState('idle')
    }, 1400)
  }

  const reset = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState('idle')
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.button
              key="idle"
              onClick={startRecording}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              aria-label={t('reporter.voice')}
              title={t('reporter.voiceHint')}
              disabled={disabled}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-900 text-white shadow-lg transition-colors hover:from-brand-700 hover:to-brand-800 disabled:opacity-40"
            >
              <Mic className="h-7 w-7" />
            </motion.button>
          )}

          {state === 'recording' && (
            <motion.button
              key="recording"
              onClick={stopRecording}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              aria-label={t('reporter.recording')}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
            >
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-red-500/40" />
              <Square className="relative h-6 w-6 fill-white" />
            </motion.button>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-civic text-white shadow-lg shadow-emerald-500/30"
            >
              <Loader2 className="h-7 w-7 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          <div className="flex h-12 items-end gap-[3px]">
            {Array.from({ length: BAR_COUNT }).map((_, i) => {
              const isActive =
                state === 'recording' &&
                ((activeBar + i) % (BAR_COUNT * 2)) < BAR_COUNT
              return (
                <motion.span
                  key={i}
                  className={cn(
                    'w-[3px] rounded-full transition-colors',
                    state === 'recording'
                      ? 'bg-emerald-civic'
                      : 'bg-brand-300 dark:bg-white/20',
                  )}
                  animate={{
                    height: isActive
                      ? `${30 + Math.abs(Math.sin(i * 0.7 + activeBar * 0.4)) * 70}%`
                      : '18%',
                  }}
                  transition={{ duration: 0.15 }}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.span
                  key="idle-txt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-brand-500 dark:text-brand-300"
                >
                  {t('reporter.voice')} · {t('reporter.voiceHint')}
                </motion.span>
              )}
              {state === 'recording' && (
                <motion.span
                  key="rec-txt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 font-semibold text-red-500"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {t('reporter.recording')}
                </motion.span>
              )}
              {state === 'processing' && (
                <motion.span
                  key="proc-txt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium text-emerald-civic-deep dark:text-emerald-civic"
                >
                  {t('reporter.processingAudio')}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {state !== 'idle' && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-400 transition-colors hover:text-brand-600 dark:hover:text-brand-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('reporter.tryAgain')}
        </motion.button>
      )}
    </div>
  )
}
