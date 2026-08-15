import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { CountUp } from '@/components/ui/CountUp'

interface HealthGaugeProps {
  score: number
  label: string
  statusLabel: string
  explanation: string
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#84cc16'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export function HealthGauge({ score, label, statusLabel, explanation }: HealthGaugeProps) {
  const color = scoreColor(score)
  const radius = 84
  const circumference = 2 * Math.PI * radius

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-900 to-brand-950 p-6 text-white shadow-card dark:border-white/10"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(16,185,129,0.25), transparent 50%), radial-gradient(circle at 90% 90%, rgba(16,185,129,0.15), transparent 55%)',
        }}
      />
      <div className="relative flex items-center gap-6">
        <div className="relative h-[190px] w-[190px] shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
            <span className="font-display text-5xl font-extrabold" style={{ color }}>
              <CountUp value={score} duration={1.4} />
            </span>
            <span className="text-xs font-medium text-white/60">/ 100</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color }} />
            <span className="text-sm font-bold" style={{ color }}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">{explanation}</p>
        </div>
      </div>
    </motion.div>
  )
}
