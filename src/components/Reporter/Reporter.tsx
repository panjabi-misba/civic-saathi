import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BrainCircuit,
  Camera,
  ChevronLeft,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type {
  AnalysisResult,
  Category,
  Complaint,
  ImageQualityReport,
  MediaItem,
  ReportInput,
  SimilarReport,
} from '@/types/civic'
import { MultimodalInput } from '@/components/Reporter/MultimodalInput'
import { AIProcessing } from '@/components/Reporter/AIProcessing'
import { AIAnalysisCard } from '@/components/Reporter/AIAnalysisCard'
import { ComplaintPreview } from '@/components/Reporter/ComplaintPreview'
import { SubmissionSuccess } from '@/components/Reporter/SubmissionSuccess'
import { VisualEvidencePanel } from '@/components/Reporter/VisualEvidencePanel'
import { SeverityBreakdown } from '@/components/Reporter/SeverityBreakdown'
import { SimilarIssues } from '@/components/Reporter/SimilarIssues'
import { EvidenceConsistency } from '@/components/Reporter/EvidenceConsistency'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLocation } from '@/hooks/useLocation'
import { useGeolocation } from '@/hooks/useGeolocation'
import { DEPARTMENTS } from '@/data/mockData'
import { formatDistance } from '@/utils/geo'
import { analyzeImageQuality, analyzeVisualEvidence, createThumbnail } from '@/utils/aiVision'
import {
  analyzeCivicReport,
  buildComplaintFromAnalysis,
  generateComplaintVariant,
  nextComplaintId,
} from '@/utils/civicAI'

interface ReporterProps {
  t: (key: string) => string
  complaints: Complaint[]
  onSubmitted: (complaint: Complaint) => void
  onSupportExisting: (id: string) => void
  onTrack: () => void
  toastSuccess: (title: string, message?: string) => void
  toastError: (title: string, message?: string) => void
  toastInfo: (title: string, message?: string) => void
}

type Stage = 'input' | 'processing' | 'analysis' | 'success'

const statusPills = [
  { key: 'app.online', icon: BrainCircuit, color: '#10B981' },
  { key: 'app.multilingual', icon: Sparkles, color: '#3B82F6' },
  { key: 'app.privacy', icon: ShieldCheck, color: '#F59E0B' },
] as const

function categoryIssueLabel(category: Category): string {
  const map: Record<Category, string> = {
    Sanitation: 'Unhygienic Waste Accumulation',
    'Roads & Infrastructure': 'Road Surface Damage',
    'Street Lighting': 'Non-Functioning Streetlight',
    'Water Supply': 'Water Supply Leakage',
    Drainage: 'Drainage Overflow',
    Pollution: 'Air Pollution / Nuisance',
    'Traffic Signal': 'Traffic Signal Malfunction',
    'Public Health': 'Public Health Hazard',
    Other: 'Reported Civic Issue',
  }
  return map[category]
}

export function Reporter({
  t,
  complaints,
  onSubmitted,
  onSupportExisting,
  onTrack,
  toastSuccess,
  toastError,
  toastInfo,
}: ReporterProps) {
  const [stage, setStage] = useState<Stage>('input')
  const [text, setText] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [blurEnabled, setBlurEnabled] = useState(true)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [draftCounter, setDraftCounter] = useState(0)
  const [submittedId, setSubmittedId] = useState('')

  const [privacyDataUrl, setPrivacyDataUrl] = useState<string | null>(null)
  const [quality, setQuality] = useState<ImageQualityReport | null>(null)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [consistencyOpen, setConsistencyOpen] = useState(false)
  const [supportedExisting, setSupportedExisting] = useState<SimilarReport | null>(null)
  const [similarDismissed, setSimilarDismissed] = useState(false)
  const [evidenceThumbs, setEvidenceThumbs] = useState<Record<string, string>>({})
  const previewRef = useRef<HTMLDivElement | null>(null)

  const { location, recentLocations, changeLocation, clearRecent } = useLocation()
  const { locating, locate } = useGeolocation()

  const locationOverride = {
    name: location.name,
    area: location.area,
    lat: location.lat,
    lng: location.lng,
  }

  const canAnalyze = text.trim().length >= 10 || media.length > 0
  const image = media.find((m) => m.type === 'image')

  const startAnalysis = () => {
    if (!canAnalyze) {
      toastError(t('reporter.requiresText'))
      return
    }
    if (image?.previewUrl) {
      void analyzeImageQuality(image.previewUrl).then(
        (q) => {
          setQuality(q)
          if (q.status !== 'good' || !q.hasEnoughEvidence) {
            setQualityOpen(true)
            return
          }
          setStage('processing')
        },
        () => setStage('processing'),
      )
      return
    }
    setStage('processing')
  }

  const runAnalysis = async (): Promise<AnalysisResult> => {
    const input: ReportInput = {
      text,
      media,
      locationLabel: location.name,
      privacyBlur: blurEnabled,
    }
    if (image?.previewUrl) {
      const { vision: vis, privacyDataUrl: pUrl, quality: q } = await analyzeVisualEvidence({
        imageUrl: image.previewUrl,
        text,
        location: {
          name: location.name,
          area: location.area,
          lat: location.lat,
          lng: location.lng,
          type: location.type,
        },
        privacyBlur: blurEnabled,
        complaints,
      })
      const thumbs: Record<string, string> = {}
      for (const m of media) {
        if (m.type === 'image' && m.previewUrl) {
          try {
            thumbs[m.id] = await createThumbnail(m.previewUrl, 180)
          } catch {
            /* keep original preview */
          }
        }
      }
      setPrivacyDataUrl(pUrl ?? null)
      setQuality(q)
      setEvidenceThumbs(thumbs)
      return analyzeCivicReport(input, {
        vision: vis,
        privacyDataUrl: pUrl,
        location,
        complaints,
        privacyBlur: blurEnabled,
        quality: q,
      })
    }
    return analyzeCivicReport(input, { location, complaints, privacyBlur: blurEnabled })
  }

  const onProcessingComplete = (result: AnalysisResult) => {
    setAnalysis(result)
    setDraftText(result.generatedComplaint)
    setEditing(false)
    setStage('analysis')
    if (result.vision && result.evidenceMatch != null && result.evidenceMatch < 65) {
      setConsistencyOpen(true)
    }
  }

  const handleCorrectCategory = (category: Category) => {
    if (!analysis) return
    const department = DEPARTMENTS[category] ?? analysis.department
    const base = {
      ...analysis,
      category,
      department,
      detectedIssue: categoryIssueLabel(category),
      signals: [...analysis.signals, `${category} — ${t('vision.detectedNote')}`],
    }
    const corrected: AnalysisResult = {
      ...base,
      generatedComplaint: generateComplaintVariant(base, draftCounter + 1),
    }
    setDraftCounter((c) => c + 1)
    setAnalysis(corrected)
    setDraftText(corrected.generatedComplaint)
    setConsistencyOpen(false)
    toastInfo(t('vision.categoryCorrected'), category)
  }

  const handleSupport = (report: SimilarReport) => {
    onSupportExisting(report.id)
    setSupportedExisting(report)
    toastSuccess(t('vision.supportedTitle'), report.id)
  }

  const handleSubmit = () => {
    if (!analysis) return
    const complaint: Complaint = {
      ...buildComplaintFromAnalysis(
        analysis,
        { text, media, locationLabel: location.name, privacyBlur: blurEnabled },
        locationOverride,
        { privacyDataUrl: privacyDataUrl ?? undefined, evidenceThumbs },
      ),
      id: nextComplaintId(),
      date: new Date().toISOString().slice(0, 10),
      support: 1,
      reportCount: 1,
    }
    onSubmitted(complaint)
    setSubmittedId(complaint.id)
    setStage('success')
    toastSuccess(t('toasts.submitted'), t('toasts.submittedMsg'))
  }

  const reset = () => {
    setStage('input')
    setText('')
    setMedia([])
    setBlurEnabled(true)
    setAnalysis(null)
    setPrivacyDataUrl(null)
    setQuality(null)
    setEvidenceThumbs({})
    setSupportedExisting(null)
    setSimilarDismissed(false)
    setEditing(false)
    setDraftText('')
  }

  const useCurrentLocation = () => {
    void locate().then((loc) => {
      if (loc) changeLocation(loc)
    })
  }

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-civic/20 bg-emerald-civic/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-civic-deep dark:text-emerald-civic">
          <Wand2 className="h-3.5 w-3.5" />
          Civic AI · Mumbai
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          <span className="text-gradient-civic">{t('app.tagline')}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-brand-500 dark:text-brand-300">
          {t('app.sub')}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {statusPills.map((pill) => {
            const Icon = pill.icon
            return (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-brand-200"
              >
                <Icon className="h-3.5 w-3.5" style={{ color: pill.color }} />
                {t(pill.key)}
              </span>
            )
          })}
        </div>
      </motion.div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="glass-card rounded-3xl p-5 sm:p-6"
            >
              <h2 className="mb-4 font-display text-lg font-bold text-brand-900 dark:text-white">
                {t('reporter.heroTitle')}
              </h2>
              <MultimodalInput
                t={t}
                text={text}
                onTextChange={setText}
                locationValue={location}
                onLocationSelect={(loc) => {
                  if (loc) changeLocation(loc)
                }}
                recentLocations={recentLocations}
                clearRecent={clearRecent}
                onUseCurrentLocation={useCurrentLocation}
                locating={locating}
                media={media}
                onMediaChange={setMedia}
                blurEnabled={blurEnabled}
                onBlurToggle={setBlurEnabled}
              />
              <div className="mt-5">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={!canAnalyze}
                  onClick={startAnalysis}
                >
                  <BrainCircuit className="h-5 w-5" />
                  {t('reporter.analyze')}
                </Button>
                <p className="mt-2.5 text-center text-[11px] text-brand-400">
                  {t('app.privacy')} · {t('common.demo')}
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <AIProcessing
                t={t}
                hasImage={Boolean(image)}
                onAnalyze={runAnalysis}
                onComplete={onProcessingComplete}
              />
            </motion.div>
          )}

          {stage === 'analysis' && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              <button
                onClick={() => setStage('input')}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-100"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.cancel')}
              </button>
              <AIAnalysisCard
                t={t}
                analysis={analysis}
                locationLabel={location.name}
                onContinue={scrollToPreview}
              />

              {analysis.vision && image && (
                <VisualEvidencePanel
                  t={t}
                  image={image}
                  detectedObjects={analysis.vision.detectedObjects}
                  detectedFactors={analysis.vision.detectedFactors}
                  privacyApplied={analysis.vision.privacyApplied}
                  fallbackUsed={analysis.vision.source === 'local-engine'}
                  evidenceMatch={analysis.evidenceMatch}
                />
              )}

              {analysis.severityBreakdown && (
                <SeverityBreakdown
                  t={t}
                  breakdown={analysis.severityBreakdown}
                  score={analysis.severityScore}
                  level={analysis.severity}
                />
              )}

              {supportedExisting ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.18 }}
                  className="overflow-hidden rounded-3xl border border-emerald-civic/30 bg-gradient-to-br from-emerald-civic/8 via-white to-violet-500/6 p-5 shadow-lift dark:from-emerald-civic/10 dark:via-brand-900 dark:to-violet-500/8"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-civic/12 text-emerald-civic-deep dark:text-emerald-civic">
                      <Heart className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-brand-900 dark:text-white">
                        {t('vision.supportedTitle')}
                      </h3>
                      <p className="text-[11px] text-brand-400">{t('vision.supportedSub')}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-brand-100 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/5">
                    <p className="font-mono text-[10px] font-semibold text-brand-400">
                      {supportedExisting.id}
                    </p>
                    <p className="mt-0.5 truncate font-display text-sm font-bold text-brand-900 dark:text-white">
                      {supportedExisting.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-civic-deep dark:text-emerald-civic">
                      <Users className="h-3 w-3" />
                      {supportedExisting.support + 1} {t('feed.citizens')} ·{' '}
                      {formatDistance(supportedExisting.distanceKm)} away
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => setSupportedExisting(null)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-civic px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-civic-deep"
                    >
                      {t('vision.createOwn')}
                    </button>
                    <button
                      onClick={reset}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
                    >
                      {t('vision.done')}
                    </button>
                  </div>
                </motion.div>
              ) : analysis.similarReports.length > 0 && !similarDismissed ? (
                <SimilarIssues
                  t={t}
                  similar={analysis.similarReports}
                  onSupport={handleSupport}
                  onCreateSeparate={() => setSimilarDismissed(true)}
                />
              ) : null}

              <div ref={previewRef} className="scroll-mt-20">
                <ComplaintPreview
                  t={t}
                  analysis={analysis}
                  editing={editing}
                  draftText={draftText}
                  onDraftChange={setDraftText}
                  onToggleEdit={() => {
                    setDraftText(analysis.generatedComplaint)
                    setEditing((e) => !e)
                  }}
                  onRegenerate={() => {
                    setDraftCounter((c) => c + 1)
                    const variant = generateComplaintVariant(analysis, draftCounter + 1)
                    setDraftText(variant)
                    setAnalysis({ ...analysis, generatedComplaint: variant })
                  }}
                  onCopy={() => toastSuccess(t('complaint.copied'))}
                  onSubmit={handleSubmit}
                  onDelete={() => {
                    reset()
                    toastInfo(t('common.cancel'))
                  }}
                />
              </div>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SubmissionSuccess
                t={t}
                complaintId={submittedId}
                onTrack={onTrack}
                onNewReport={reset}
                onShare={() => toastSuccess(t('success.share'))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={qualityOpen && !!quality}
        onClose={() => setQualityOpen(false)}
        title={t('vision.qualityTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-brand-900 dark:text-white">
                {t('vision.qualityWarningTitle')}
              </p>
              <p className="text-[12px] text-brand-600 dark:text-brand-200">
                {quality?.status === 'poor'
                  ? t('vision.qualityPoorTitle')
                  : t('vision.qualityFairTitle')}
              </p>
              {quality?.messages.map((m) => (
                <p key={m} className="text-[12px] leading-relaxed text-brand-500 dark:text-brand-300">
                  · {m}
                </p>
              ))}
              <p className="text-[11px] text-brand-400">{t('vision.qualityLowEvidence')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setQualityOpen(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
            >
              <Camera className="h-3.5 w-3.5" />
              {t('vision.uploadBetter')}
            </button>
            <button
              onClick={() => {
                setQualityOpen(false)
                setStage('processing')
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-800 dark:bg-white dark:text-brand-900 dark:hover:bg-brand-100"
            >
              {t('vision.qualityContinue')}
            </button>
          </div>
        </div>
      </Modal>

      {analysis && (
        <EvidenceConsistency
          t={t}
          open={consistencyOpen}
          match={analysis.evidenceMatch ?? 0}
          detectedIssue={analysis.detectedIssue}
          reportedText={text}
          mismatch={(analysis.evidenceMatch ?? 0) < 65}
          onCorrect={handleCorrectCategory}
          onContinue={() => setConsistencyOpen(false)}
          onClose={() => setConsistencyOpen(false)}
        />
      )}
    </div>
  )
}
