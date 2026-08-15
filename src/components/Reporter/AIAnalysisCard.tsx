import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Landmark,
  MapPin,
  ShieldAlert,
  Sparkles,
  Clock,
  Users,
  ArrowDown,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import type { AnalysisResult } from '@/types/civic'
import { Badge } from '@/components/ui/Badge'
import { SEVERITY_META } from '@/data/mockData'
import { cn } from '@/utils/cn'

interface AIAnalysisCardProps {
  t: (key: string) => string
  analysis: AnalysisResult
  locationLabel?: string
  onContinue?: () => void
}

function severityBarColor(score: number): string {
  if (score >= 85) return 'bg-red-500'
  if (score >= 72) return 'bg-amber-500'
  if (score >= 55) return 'bg-emerald-civic'
  return 'bg-brand-400'
}

function levelLabel(level: string): string {
  if (level === 'Critical') return 'CRITICAL PRIORITY'
  if (level === 'High') return 'HIGH PRIORITY'
  if (level === 'Medium') return 'MEDIUM PRIORITY'
  return 'STANDARD PRIORITY'
}

export function AIAnalysisCard({ t, analysis, locationLabel, onContinue }: AIAnalysisCardProps) {
  const [showReason, setShowReason] = useState(false)
  const severity = SEVERITY_META[analysis.severity] ?? SEVERITY_META.Medium
  const priorityLevel = analysis.priorityLevel ?? analysis.severity

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lift dark:border-white/10 dark:bg-brand-900"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${severity.color}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
        style={{ background: `${severity.color}22` }}
      />

      <div className="relative border-b border-brand-100 px-5 py-4 dark:border-white/8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-civic-deep dark:text-emerald-civic">
            <Sparkles className="h-4 w-4" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wide">
              ✦ {t('vision.resultCardTitle')}
            </h3>
          </div>
          {analysis.vision && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                analysis.vision.source === 'vision-model'
                  ? 'bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
              )}
            >
              {analysis.vision.source === 'vision-model'
                ? t('vision.modelVision')
                : t('vision.localEngine')}
            </span>
          )}
        </div>
        <p className="mt-2 font-display text-2xl font-extrabold uppercase leading-tight text-brand-900 dark:text-white">
          {analysis.detectedIssue}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge bg="rgba(16,185,129,0.12)" color="#059669">
            {analysis.category}
          </Badge>
          <Badge bg={severity.bg} color={severity.color} dot>
            {analysis.severity}
          </Badge>
        </div>
      </div>

      <div className="relative space-y-4 p-5">
        {/* Score hero */}
        <div className="flex items-center gap-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-white/8 dark:bg-white/4">
          <div className="text-center">
            <div className="flex items-end justify-center gap-1">
              <span className="font-display text-5xl font-extrabold leading-none" style={{ color: severity.color }}>
                {analysis.severityScore}
              </span>
              <span className="pb-1 text-sm font-semibold text-brand-400">/100</span>
            </div>
            <p className="mt-1.5 text-[11px] font-extrabold tracking-widest" style={{ color: severity.color }}>
              {levelLabel(priorityLevel)}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.severityScore}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className={cn('h-full rounded-full', severityBarColor(analysis.severityScore))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge bg="rgba(59,130,246,0.12)" color="#2563EB">
                {t('analysis.confidence')}: {analysis.confidence}%
              </Badge>
              {analysis.evidenceMatch != null && (
                <Badge bg="rgba(16,185,129,0.12)" color="#059669">
                  {t('vision.evidenceMatch')}: {analysis.evidenceMatch}%
                </Badge>
              )}
              {analysis.priorityScore != null && (
                <Badge bg="rgba(139,92,246,0.12)" color="#7c3aed">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {t('vision.civicPriority')}: {analysis.priorityScore}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Detected visual factors */}
        {(analysis.vision?.detectedFactors ?? analysis.signals).length > 0 && (
          <div className="rounded-2xl border border-emerald-civic/20 bg-emerald-civic/6 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              {analysis.vision ? t('vision.aiDetected') : t('analysis.signals')}
            </p>
            <ul className="space-y-1.5">
              {(analysis.vision?.detectedFactors ?? analysis.signals).slice(0, 6).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-brand-700 dark:text-brand-100">
                  <span className="mt-0.5 text-emerald-civic">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Location context */}
        {(locationLabel || analysis.locationContext) && (
          <div className="rounded-2xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-civic-deep dark:text-emerald-civic" />
              <p className="text-xs font-bold text-brand-900 dark:text-white">
                {locationLabel ?? t('analysis.locationRisk')}
              </p>
            </div>
            {analysis.locationContext && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-brand-500 dark:text-brand-300">
                {analysis.locationContext}
              </p>
            )}
          </div>
        )}

        {/* Department */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-center gap-1.5 text-brand-400">
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('analysis.department')}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-brand-800 dark:text-brand-100">
              {analysis.department}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-civic-deep dark:text-emerald-civic">
              {analysis.estimatedPriority}
            </p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-center gap-1.5 text-brand-400">
              <Landmark className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('analysis.locationRisk')}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-brand-800 dark:text-brand-100">
              {analysis.locationRisk}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-brand-400">
              <Clock className="h-3 w-3" />
              {t('analysis.estResolution')}: {analysis.estimatedResolutionDays} {t('analysis.days')}
            </p>
          </div>
        </div>

        {/* Risk factors */}
        {analysis.riskFactors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {analysis.riskFactors.slice(0, 4).map((r) => (
              <span
                key={r}
                className="rounded-full border border-amber-500/25 bg-amber-500/8 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
              >
                ⚠ {r}
              </span>
            ))}
          </div>
        )}

        {analysis.similarReports.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-brand-400">
            <Users className="h-3 w-3" />
            {analysis.similarReports.length} {t('vision.similarNearby')}
          </p>
        )}

        {/* AI reasoning */}
        <button
          onClick={() => setShowReason((s) => !s)}
          aria-expanded={showReason}
          className="flex w-full items-center justify-between rounded-xl border border-brand-100 bg-white/70 px-3.5 py-3 text-left transition-colors hover:bg-brand-50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-100">
            <Landmark className="h-3.5 w-3.5 text-brand-400" />
            {t('vision.viewReasoning')}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-brand-400 transition-transform', showReason && 'rotate-180')}
          />
        </button>
        <AnimatePresence>
          {showReason && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 rounded-2xl bg-amber-500/8 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-[13px] leading-relaxed text-brand-700 dark:text-brand-100">
                    {analysis.severityReason}
                  </p>
                </div>
                {analysis.fallbackUsed && (
                  <p className="text-[11px] leading-relaxed text-brand-400">
                    {t('vision.uncertaintyNote')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {onContinue && (
          <button
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 dark:bg-white dark:text-brand-900 dark:hover:bg-brand-100"
          >
            {t('vision.continueToComplaint')}
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
