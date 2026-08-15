import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/utils/cn'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  autoFocus?: boolean
  onComplete: () => void
}

export function OtpInput({ value, onChange, disabled, autoFocus, onComplete }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && index < value.length - 1) {
      refs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '') && next.join('').length === value.length) {
      onComplete()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, value.length)
      .split('')
    if (digits.length === 0) return
    const next = [...value]
    digits.forEach((d, i) => {
      next[i] = d
    })
    onChange(next)
    const focusIndex = Math.min(digits.length, value.length - 1)
    refs.current[focusIndex]?.focus()
    if (next.every((d) => d !== '') && next.join('').length === value.length) {
      onComplete()
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5" role="group" aria-label="OTP input">
      {value.map((digit, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative"
        >
          <input
            ref={(el) => {
              refs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            autoFocus={autoFocus && i === 0}
            className={cn(
              'h-12 w-10 rounded-xl border text-center font-display text-lg font-bold text-brand-900 shadow-sm transition-all sm:h-14 sm:w-12 sm:text-xl',
              digit
                ? 'border-emerald-civic bg-emerald-civic/6 text-brand-900 focus:outline-none focus:ring-2 focus:ring-emerald-civic/40 dark:border-emerald-civic/60 dark:text-white'
                : 'border-brand-200 bg-white text-brand-900 placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none focus:ring-2 focus:ring-emerald-civic/30 dark:border-white/12 dark:bg-white/5 dark:text-white',
              disabled && 'opacity-60',
            )}
          />
          <AnimatePresence>
            {digit && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="pointer-events-none absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-civic"
              />
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}
