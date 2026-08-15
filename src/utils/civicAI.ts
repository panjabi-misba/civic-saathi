import type {
  AIVisionAnalysis,
  AnalysisResult,
  Category,
  CivicLocation,
  Complaint,
  ReportInput,
  Severity,
  SeverityBreakdownFactor,
  SimilarReport,
} from '@/types/civic'
import { DEPARTMENTS } from '@/data/mockData'
import { haversineKm } from '@/utils/geo'
import { buildLocationContext } from '@/utils/aiVision'

let idCounter = 182

function normalize(text: string): string {
  return text.toLowerCase().trim()
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => normalize(text).includes(k))
}

interface Classified {
  issue: string
  category: Category
  department: string
  severity: Severity
  score: number
  reason: string
  complaint: string
  priority: string
  resolutionDays: number
  signals: string[]
  risk: string
}

function classify(text: string, hasMedia: boolean, hasVideo: boolean, hasImage: boolean): Classified {
  const locationSensitive = hasAny(text, [
    'school',
    'hospital',
    'college',
    'clinic',
    'market',
    'station',
    'nursery',
    'park',
  ])
  const prolonged = hasAny(text, [
    'week',
    'days',
    'day',
    'month',
    'long time',
    'since monday',
    'uncollected',
  ])
  const danger = hasAny(text, ['danger', 'injury', 'slippery', 'accident', 'open', 'unsafe'])

  const boost = (locationSensitive ? 10 : 0) + (prolonged ? 8 : 0) + (danger ? 9 : 0) + (hasMedia ? 4 : 0)

  let c: Classified

  if (
    hasAny(text, [
      'garbage',
      'waste',
      'trash',
      'rubbish',
      'kabada',
      'kacra',
      'kuchra',
      'debris',
      'dumping',
      'overflowing bin',
    ]) ||
    (hasMedia && hasAny(text, ['smell', 'stink', 'clean', 'collection']))
  ) {
    c = base('Garbage Accumulation', 'Sanitation', 88, 'High', 'Municipal Sanitation Department')
    c.issue = hasAny(text, ['debris', 'construction', 'dumping']) ? 'Construction Waste Dumping' : c.issue
    c.reason =
      'AI detected uncollected waste in a public area' +
      (locationSensitive ? ' near a school, hospital or market' : '') +
      (prolonged ? '. It appears to have persisted for several days' : '') +
      ', which creates sanitation and public-health risks for nearby residents and pedestrians.'
    c.complaint = complaintText(text, 'uncollected waste is accumulating', locationSensitive)
  } else if (
    hasAny(text, [
      'pothole',
      'crater',
      'road damage',
      'potholes',
      'hole in the road',
      'break in road',
    ])
  ) {
    c = base('Deep Pothole', 'Roads & Infrastructure', 84, 'High', 'Roads & Infrastructure Department')
    c.reason =
      'AI identified road surface damage in a high-traffic area' +
      (danger ? '. It is dangerous for two-wheelers and can cause accidents or tyre damage' : '') +
      (prolonged ? ' and appears to have been present for a while' : '') +
      ', raising the priority for quick repair.'
    c.complaint = complaintText(text, 'the road surface is badly damaged', locationSensitive)
  } else if (
    hasAny(text, [
      'streetlight',
      'street light',
      'light not working',
      'lamp',
      'dark stretch',
      'no light',
      'light broken',
      'lightning pole',
    ])
  ) {
    c = base('Non-Functioning Streetlight', 'Street Lighting', 79, 'Medium', 'Electrical Maintenance Department')
    c.reason =
      'AI identified a lighting failure on a public road' +
      (danger ? '. Darkness creates a safety risk for pedestrians and two-wheeler riders at night' : '') +
      '. Severity increases in high-footfall stretches such as markets and stations.'
    c.complaint = complaintText(text, 'street lights are not functioning', locationSensitive)
  } else if (
    hasAny(text, [
      'water leak',
      'leaking',
      'leak',
      'pipe burst',
      'water waste',
      'tap',
      'pipeline leak',
      'water flowing',
    ])
  ) {
    c = base('Water Pipeline Leakage', 'Water Supply', 90, 'Critical', 'Water Supply & Sewerage Department')
    c.reason =
      'AI detected a live water leak that is wasting treated water' +
      (danger ? ' and creating slippery, hazardous surfaces' : '') +
      '. High water wastage and the risk of road damage make this a critical, time-sensitive issue.'
    c.complaint = complaintText(text, 'water is leaking continuously from a pipeline', locationSensitive)
  } else if (
    hasAny(text, ['drain', 'drainage', 'manhole', 'sewer', 'flooding', 'waterlogging', 'overflow'])
  ) {
    c = base('Drainage Overflow', 'Drainage', 82, 'High', 'Drainage & Stormwater Department')
    c.reason =
      'AI detected a drainage or stormwater failure affecting the locality' +
      (danger ? ', with exposed manholes posing a direct safety hazard' : '') +
      '. Blocked drainage also increases the risk of waterlogging during rain.'
    c.complaint = complaintText(text, 'the drainage system is blocked and overflowing', locationSensitive)
  } else if (
    hasAny(text, ['smoke', 'pollution', 'stink', 'odour', 'smell', 'fumes', 'dust', 'burning'])
  ) {
    c = base('Air Pollution / Nuisance', 'Pollution', 76, 'Medium', 'Environment & Pollution Control Department')
    c.reason =
      'AI detected signs of pollution or nuisance emissions' +
      (locationSensitive ? ' in a sensitive area such as a school, hospital or residential pocket' : '') +
      ', which affects the health of nearby residents, especially children and the elderly.'
    c.complaint = complaintText(text, 'the area is affected by pollution or nuisance emissions', locationSensitive)
  } else {
    c = base('Reported Civic Issue', 'Other', 71, 'Low', 'Municipal Grievance Cell')
    c.reason =
      'AI could not match this report to a specific civic category with high confidence. It has been routed to the central grievance cell, which will investigate and assign the right department.'
    c.complaint = complaintText(text, 'the reported civic issue requires attention', locationSensitive)
  }

  let finalScore = Math.min(99, Math.round(c.score + boost))
  let severity: Severity = c.severity
  if (finalScore >= 88) severity = 'Critical'
  else if (finalScore >= 72) severity = 'High'
  else if (finalScore >= 55) severity = 'Medium'
  else severity = 'Low'

  const priority =
    severity === 'Critical'
      ? 'Respond within 24 hours'
      : severity === 'High'
        ? 'Respond within 48 hours'
        : severity === 'Medium'
          ? 'Respond within 5 working days'
          : 'Respond within 10 working days'

  c.signals = []
  if (locationSensitive) c.signals.push('Location sensitivity detected (school / hospital / market)')
  if (prolonged) c.signals.push('Issue appears to have persisted over time')
  if (danger) c.signals.push('Public safety risk flagged')
  if (hasVideo) c.signals.push('Video evidence strengthens the report')
  if (hasImage) c.signals.push('Photo evidence attached')

  c.risk = locationSensitive
    ? 'Sensitive zone — higher response priority'
    : danger
      ? 'Public safety risk present'
      : 'Standard residential / public area'

  c.resolutionDays =
    severity === 'Critical' ? 2 : severity === 'High' ? 5 : severity === 'Medium' ? 10 : 15

  return { ...c, score: finalScore, severity, priority }
}

function base(
  issue: string,
  category: Category,
  confidence: number,
  severity: Severity,
  department: string,
): Classified {
  return {
    issue,
    category,
    department,
    severity,
    score: confidence,
    reason: '',
    complaint: '',
    priority: '',
    resolutionDays: 5,
    signals: [],
    risk: '',
  }
}

function complaintText(raw: string, issuePhrase: string, sensitive: boolean): string {
  const loc = extractLocation(raw) ?? 'the reported area'
  const context =
    sensitive && raw.toLowerCase().includes('school')
      ? 'near a school entrance, raising concerns for the safety and health of students'
      : sensitive
        ? 'in a densely used public area'
        : 'in the locality'
  return `I am writing to bring to your attention that ${issuePhrase} at ${loc}, ${context}. ` +
    `This has been ongoing and is creating inconvenience and concern for residents. ` +
    `I request the concerned authority to inspect the site and take corrective action at the earliest.`
}

const KNOWN_LOCATIONS = [
  'khar west',
  'bandra west',
  'matunga',
  'mankhurd',
  'kurla',
  'andheri east',
  'andheri',
  'dadar',
  'ghatkopar',
  'borivali west',
  'chembur',
  'worli',
  'powai',
  'malad',
  'juhu',
  'colaba',
  'dahisar',
  'thane',
]

function extractLocation(text: string): string | null {
  const found = KNOWN_LOCATIONS.find((l) => normalize(text).includes(l))
  if (!found) return null
  return found.replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export interface CivicAnalysisOptions {
  vision?: AIVisionAnalysis
  privacyDataUrl?: string
  location?: CivicLocation | ComplaintLocationOverride
  complaints?: Complaint[]
  privacyBlur?: boolean
  quality?: import('@/types/civic').ImageQualityReport
}

export function analyzeCivicReport(
  input: ReportInput,
  options: CivicAnalysisOptions = {},
): AnalysisResult {
  const text = input.text || 'A civic issue was reported in the area with attached media evidence.'
  const hasVideo = input.media.some((m) => m.type === 'video')
  const hasImage = input.media.some((m) => m.type === 'image')
  const c = classify(text, input.media.length > 0, hasVideo, hasImage)

  const location = options.location
  const locContext = location
    ? buildLocationContext({
        name: location.name,
        area: location.area,
        lat: location.lat,
        lng: location.lng,
        type: 'type' in location ? location.type : undefined,
      })
    : null
  const sensitivity = locContext?.sensitivity === 'none' ? 'residential' : (locContext?.sensitivity ?? 'residential')

  const vision = options.vision
  const similarReports =
    options.complaints && options.complaints.length > 0
      ? findSimilarReports(c.category, text, options.complaints, location?.lat, location?.lng)
      : []

  let detectedIssue = c.issue
  let category = c.category
  let severityScore = c.score
  let severity: Severity = c.severity
  let severityReason = c.reason
  let department = c.department
  let signals = [...c.signals]
  let riskFactors = c.signals.filter((s) => /risk|sensitive|danger|safety|persisted/i.test(s))
  let breakdown: SeverityBreakdownFactor[] = []
  let evidenceMatch: number | undefined
  let priorityScore = severityScore
  let priorityLevel = severity
  let locationContext: string | undefined
  const fallbackUsed = Boolean(vision && vision.source === 'local-engine')

  if (vision) {
    detectedIssue = vision.detectedIssue
    category = vision.category
    severityScore = vision.severityScore
    severity = vision.severityLevel
    severityReason = vision.explanation
    department = vision.recommendedDepartment
    evidenceMatch = vision.evidenceMatch
    locationContext = vision.locationContext

    signals = [...vision.detectedFactors, ...c.signals.filter((s) => !vision.detectedFactors.includes(s))]
    riskFactors = [...vision.riskFactors, ...c.signals.filter((s) => /risk|danger|safety|sensitive/i.test(s))]

    // Merge text signals into a transparent combined breakdown.
    const impactSum = vision.severityBreakdown.reduce((sum, f) => sum + Math.max(0, f.impact), 0)
    const scale = impactSum > 0 ? severityScore / impactSum : 1
    const base = vision.severityBreakdown.map((f) => ({
      factor: f.factor,
      impact: Math.round(Math.max(0, f.impact) * scale),
    }))
    breakdown = base
  } else {
    // Text-only transparent breakdown
    const locBoost = sensitivity === 'school' || sensitivity === 'hospital' ? 14 : sensitivity === 'market' || sensitivity === 'railway_station' ? 10 : sensitivity === 'park' ? 6 : 0
    const prolonged = /week|days|day|month|long time|since|uncollected/i.test(text)
    const danger = /danger|injury|slippery|accident|open|unsafe/i.test(text)
    const list: SeverityBreakdownFactor[] = [{ factor: 'Issue category baseline', impact: Math.round(c.score * 0.5) }]
    if (locBoost > 0) list.push({ factor: 'Location sensitivity', impact: locBoost })
    if (prolonged) list.push({ factor: 'Duration from user report', impact: 8 })
    if (danger) list.push({ factor: 'Public safety risk', impact: 9 })
    if (hasImage) list.push({ factor: 'Photo evidence attached', impact: 3 })
    else if (hasVideo) list.push({ factor: 'Video evidence attached', impact: 3 })
    const sum = list.reduce((s, f) => s + f.impact, 0)
    breakdown = list.map((f) => ({ factor: f.factor, impact: Math.round((f.impact / sum) * severityScore) }))
    if (locContext) locationContext = locContext.summary
  }

  // Combined Civic Priority Engine: image severity + text + location + community support + recurrence.
  const community = similarReports.reduce((sum, r) => sum + r.support, 0)
  const recurrence = similarReports.length
  priorityScore = Math.max(
    20,
    Math.min(
      99,
      Math.round(severityScore * 0.72 + Math.min(community, 50) * 0.3 + Math.min(recurrence, 8) * 1.6),
    ),
  )
  priorityLevel = severityLabel(priorityScore)

  const confidence = Math.max(
    40,
    Math.round(vision ? (vision.confidence * 0.6 + c.score * 0.4) : c.score - 2 + (input.media.length > 0 ? 2 : 0)),
  )

  const recommendedAction = recommendedActionFor(severity, category)
  const generatedComplaint = vision
    ? formalComplaintFromMultimodal(vision, input, location, sensitivity)
    : c.complaint

  return {
    detectedIssue,
    category,
    confidence,
    severity,
    severityScore,
    severityReason,
    department,
    generatedComplaint,
    locationRisk: locationRiskLabel(sensitivity, c.risk),
    estimatedPriority: priorityLabel(priorityLevel),
    estimatedResolutionDays: resolutionDaysFor(severity),
    signals,
    riskFactors,
    similarReports,
    recommendedAction,
    vision,
    severityBreakdown: breakdown,
    evidenceMatch,
    detectedObjects: vision?.detectedObjects,
    priorityScore,
    priorityLevel,
    locationContext,
    quality: options.quality,
    fallbackUsed,
  }
}

function severityLabel(score: number): Severity {
  if (score >= 88) return 'Critical'
  if (score >= 72) return 'High'
  if (score >= 55) return 'Medium'
  return 'Low'
}

function recommendedActionFor(severity: Severity, category: Category): string {
  if (severity === 'Critical') return 'Dispatch an emergency inspection team within 2 hours and barricade the affected area.'
  if (severity === 'High') return 'Assign a field team for inspection within 24 hours and schedule remedial work.'
  if (severity === 'Medium') return 'Schedule inspection and remediation within 5 working days.'
  return category === 'Sanitation'
    ? 'Include in the weekly sanitation sweep with a documented follow-up.'
    : 'Include in the monthly civic maintenance cycle with a documented follow-up.'
}

function priorityLabel(level: Severity): string {
  if (level === 'Critical') return 'Respond within 24 hours'
  if (level === 'High') return 'Respond within 48 hours'
  if (level === 'Medium') return 'Respond within 5 working days'
  return 'Respond within 10 working days'
}

function resolutionDaysFor(severity: Severity): number {
  return severity === 'Critical' ? 2 : severity === 'High' ? 5 : severity === 'Medium' ? 10 : 15
}

function locationRiskLabel(sensitivity: string, textRisk: string): string {
  if (sensitivity === 'school' || sensitivity === 'hospital') return 'Sensitive zone — higher response priority'
  if (sensitivity === 'market' || sensitivity === 'railway_station') return 'High-footfall public area — priority raised'
  return textRisk
}

export function formalComplaintFromMultimodal(
  vision: AIVisionAnalysis,
  input: ReportInput,
  location: CivicLocation | ComplaintLocationOverride | undefined,
  sensitivity: string,
): string {
  const loc = location?.name ?? input.locationLabel ?? 'the reported area'
  const area = location?.area ?? 'Mumbai'
  const sentence = lowerFirst(vision.explanation).replace(/\.+$/, '')
  const sensitivityNote =
    sensitivity === 'school'
      ? ' The location is near a school, which raises concern for the safety and health of students.'
      : sensitivity === 'hospital'
        ? ' The location is near a hospital, which makes the issue time-sensitive.'
        : ''
  const evidenceNote = input.media.some((m) => m.type === 'image')
    ? ' Attached visual evidence was analysed and found to be consistent with this report.'
    : ''
  return (
    `I would like to formally report ${lowerFirst(vision.detectedIssue)} near ${loc}, ${area}. ` +
    `${sentence}.${sensitivityNote}${evidenceNote}\n\n` +
    `Detected factors: ${vision.detectedFactors.join(', ')}. ` +
    `I request ${vision.recommendedDepartment} to inspect the site at the earliest and take corrective action. ` +
    `This complaint is registered with Civic Saathi for transparent tracking until resolution.`
  )
}

export function findSimilarReports(
  category: Category,
  text: string,
  complaints: Complaint[],
  originLat?: number,
  originLng?: number,
  maxDistanceKm = 2,
): SimilarReport[] {
  const keywords = categoryKeywords(category)
  const matches = complaints
    .filter((c) => c.category === category)
    .map((c) => {
      const distanceKm =
        originLat != null && originLng != null && c.lat != null && c.lng != null
          ? haversineKm(originLat, originLng, c.lat, c.lng)
          : Infinity
      return { c, distanceKm }
    })
    .filter((m) => m.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  const textKw = text.toLowerCase()
  const keywordHits = matches.filter(() => keywords.some((k) => textKw.includes(k)))

  const pool = keywordHits.length > 0 ? keywordHits : matches
  return pool.slice(0, 5).map((m) => ({
    id: m.c.id,
    title: m.c.title,
    distanceKm: m.c.distanceKm ?? m.distanceKm,
    support: m.c.support,
    status: m.c.status,
  }))
}

function categoryKeywords(category: Category): string[] {
  switch (category) {
    case 'Sanitation':
      return ['garbage', 'waste', 'trash', 'rubbish', 'kacra', 'smell', 'stink']
    case 'Roads & Infrastructure':
      return ['pothole', 'road', 'crater', 'hole']
    case 'Street Lighting':
      return ['light', 'lamp', 'dark', 'streetlight']
    case 'Water Supply':
      return ['water', 'leak', 'pipe', 'flowing']
    case 'Drainage':
      return ['drain', 'manhole', 'sewer', 'waterlog']
    case 'Pollution':
      return ['smoke', 'dust', 'pollution', 'burning', 'debris']
    case 'Traffic Signal':
      return ['signal', 'traffic']
    default:
      return []
  }
}

export function generateComplaintVariant(analysis: AnalysisResult, seed: number): string {
  const intros = [
    `I am writing to formally bring to your notice that ${lowerFirst(analysis.detectedIssue)} has been observed at the location described below.`,
    `This is to lodge a formal complaint regarding ${lowerFirst(analysis.detectedIssue)} in our locality.`,
    `Respected Sir/Madam, I wish to report ${lowerFirst(analysis.detectedIssue)} in the area mentioned in this grievance.`,
  ]
  const bodies = [
    `The situation is affecting daily life for residents and needs urgent corrective action. Photographic evidence is attached for reference.`,
    `This has been causing concern among local residents, and we request immediate inspection and remediation.`,
    `We request the department to depute a team to inspect the site at the earliest and resolve the matter.`,
  ]
  const outro = `This complaint is registered with Civic Saathi for transparent tracking until resolution. We expect an acknowledgement and a resolution within a reasonable timeframe.`

  const i = intros[seed % intros.length]
  const b = bodies[(seed + 1) % bodies.length]
  return `${i}\n\n${b}\n\n${outro}`
}

export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

export function nextComplaintId(date: Date = new Date()): string {
  idCounter += 1
  const y = date.getFullYear()
  return `CS-MUM-${y}-${String(idCounter).padStart(5, '0')}`
}

export function mockSpeechToText(sample: string): string {
  const map: Array<{ keys: string[]; value: string }> = [
    {
      keys: ['garbage', 'waste', 'trash'],
      value: 'There is garbage lying on the road near the market for several days. It is smelling very badly.',
    },
    {
      keys: ['pothole', 'hole'],
      value: 'There is a very deep pothole in the middle of the road near the crossing. It is dangerous for bikes.',
    },
    {
      keys: ['light', 'streetlight'],
      value: 'The streetlight is not working on our road for almost a week. The road is completely dark at night.',
    },
    {
      keys: ['water', 'leak', 'pipe'],
      value: 'Water is leaking from a pipeline on our street and the whole lane is flooding since two days.',
    },
  ]
  const n = sample.toLowerCase()
  const found = map.find((m) => m.keys.some((k) => n.includes(k)))
  return found ? found.value : sample
}

export interface ComplaintLocationOverride {
  name: string
  area: string
  lat: number
  lng: number
}

export function buildComplaintFromAnalysis(
  analysis: AnalysisResult,
  input: ReportInput,
  locationOverride?: ComplaintLocationOverride,
  opts?: { privacyDataUrl?: string; evidenceThumbs?: Record<string, string> },
): Omit<Complaint, 'id' | 'date' | 'support' | 'reportCount'> {
  const now = new Date()
  const location = (locationOverride?.name ?? input.locationLabel) || 'Mumbai'
  const signal = mapSignal(analysis.category)
  const evidenceImages = input.media.map((m) => {
    const id = `ev-${m.id}`
    const thumb = opts?.evidenceThumbs?.[m.id]
    return {
      id,
      name: m.name,
      type: m.type,
      privacyUrl:
        m.type === 'image' && opts?.privacyDataUrl
          ? opts.privacyDataUrl
          : (thumb ?? m.previewUrl),
      thumbUrl: thumb ?? m.previewUrl,
    }
  })
  return {
    title: analysis.detectedIssue,
    category: analysis.category,
    description: analysis.generatedComplaint,
    location,
    area: locationOverride?.area ?? 'Bandra West',
    city: 'Mumbai',
    reportedAt: now.toISOString(),
    severity: analysis.severity,
    severityScore: analysis.severityScore,
    status: 'Reported',
    department: analysis.department,
    confidence: analysis.confidence,
    communitySignal: false,
    signal,
    signalStrength: 'moderate',
    reporter: 'You',
    isMine: true,
    progress: 0,
    expectedAction: analysis.recommendedAction,
    resolution: {
      officialResponse:
        'Your grievance has been registered in the system and forwarded to the concerned department for verification and action.',
      aiExplanation:
        'Your complaint has been registered. The department will review it, and you will be able to track every step here.',
    },
    lat: locationOverride?.lat ?? 19.0596,
    lng: locationOverride?.lng ?? 72.8295,
    timeline: [
      {
        id: `tl-${now.getTime()}`,
        stage: 'Reported',
        timestamp: now.toISOString(),
        label: 'Reported',
        description: 'Complaint filed through Civic Saathi.',
        actor: 'You',
        kind: 'system',
        status: 'done',
      },
    ],
    comments: [],
    evidence: input.media.map((m) => ({
      id: `ev-${m.id}`,
      name: m.name,
      type: m.type,
      uploadedAt: now.toISOString(),
      by: 'You',
    })),
    authorityFeed: [],
    aiAnalysis: {
      detectedIssue: analysis.detectedIssue,
      severityScore: analysis.severityScore,
      aiConfidence: analysis.confidence,
      evidenceMatch: analysis.evidenceMatch ?? 0,
      detectedFactors: analysis.vision?.detectedFactors ?? analysis.signals,
      severityReason: analysis.severityReason,
      recommendedDepartment: analysis.department,
      aiGeneratedComplaint: analysis.generatedComplaint,
      priorityScore: analysis.priorityScore ?? analysis.severityScore,
      priorityLevel: analysis.priorityLevel ?? analysis.severity,
      explanation:
        analysis.vision?.explanation ??
        analysis.severityReason,
      source: analysis.vision?.source ?? 'text-only',
      evidenceImages,
    },
  }
}

function mapSignal(category: Category): Complaint['signal'] {
  switch (category) {
    case 'Sanitation':
    case 'Pollution':
      return 'garbage'
    case 'Street Lighting':
      return 'streetlight'
    case 'Roads & Infrastructure':
      return 'pothole'
    case 'Water Supply':
    case 'Drainage':
      return 'water'
    default:
      return 'garbage'
  }
}

export function classifyForSignal(signal: string): Category {
  switch (signal) {
    case 'garbage':
      return 'Sanitation'
    case 'streetlight':
      return 'Street Lighting'
    case 'pothole':
      return 'Roads & Infrastructure'
    case 'water':
      return 'Water Supply'
    default:
      return 'Other'
  }
}

export { DEPARTMENTS }
