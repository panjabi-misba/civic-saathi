import { AnimatePresence, motion } from 'framer-motion'
import { Landmark, Sparkles, Wand2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

interface TranslatorCardProps {
  t: (key: string) => string
  officialResponse: string
  aiExplanation: string
}

export function TranslatorCard({ t, officialResponse, aiExplanation }: TranslatorCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [typing, setTyping] = useState(false)
  const [shownText, setShownText] = useState('')

  useEffect(() => {
    if (!typing) return
    let i = 0
    const tm = window.setInterval(() => {
      i += 1
      setShownText(aiExplanation.slice(0, i))
      if (i >= aiExplanation.length) {
        window.clearInterval(tm)
        setTyping(false)
      }
    }, 16)
    return () => window.clearInterval(tm)
  }, [typing, aiExplanation])

  const explain = () => {
    if (revealed) return
    setTyping(true)
    setShownText('')
    window.setTimeout(() => setRevealed(true), 100)
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 dark:border-white/8 dark:bg-white/4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/8">
          <Landmark className="h-4 w-4 text-brand-400" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-100">
            {t('tracker.translatorTitle')}
          </p>
          <p className="text-[10px] text-brand-400">{t('tracker.translatorSub')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-brand-200/70 bg-white p-3.5 dark:border-white/10 dark:bg-brand-800/60">
        <p className="text-[13px] italic leading-relaxed text-brand-600 dark:text-brand-200">
          “{officialResponse}”
        </p>
      </div>

      <AnimatePresence>
        {!revealed ? (
          <motion.button
            key="btn"
            exit={{ opacity: 0, y: -6 }}
            onClick={explain}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 py-2.5 text-sm font-semibold text-emerald-civic-deep transition-colors hover:bg-emerald-civic/15 dark:text-emerald-civic"
          >
            <Wand2 className="h-4 w-4" />
            {t('tracker.explainSimply')}
          </motion.button>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-civic/25 bg-emerald-civic/8 p-3.5 dark:bg-emerald-civic/8">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-civic" />
              <div>
                {typing ? (
                  <span className="flex items-center gap-2 text-[13px] text-brand-500 dark:text-brand-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('tracker.translating')}
                  </span>
                ) : (
                  <p className="text-[13px] leading-relaxed text-brand-700 dark:text-brand-100">
                    {shownText}
                  </p>
                )}
                {!typing && (
                  <button
                    onClick={() => setRevealed(false)}
                    className={cn('mt-2 text-[11px] font-semibold text-brand-400 transition-colors hover:text-emerald-civic-deep dark:hover:text-emerald-civic')}
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
