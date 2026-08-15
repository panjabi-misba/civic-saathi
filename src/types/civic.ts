export type ViewKey =
  | 'overview'
  | 'report'
  | 'myreports'
  | 'nearby'
  | 'civicmap'
  | 'community'
  | 'assistant'

export type ThemeMode = 'light' | 'dark'
export type Language = 'en' | 'hi' | 'mr'

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export type ComplaintStatus =
  | 'Reported'
  | 'AI Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Citizen Disputed'

export type Category =
  | 'Sanitation'
  | 'Roads & Infrastructure'
  | 'Street Lighting'
  | 'Water Supply'
  | 'Drainage'
  | 'Public Health'
  | 'Pollution'
  | 'Traffic Signal'
  | 'Other'

export type Signal =
  | 'garbage'
  | 'streetlight'
  | 'pothole'
  | 'water'
  | 'drainage'
  | 'pollution'
  | 'traffic'

export type SignalStrength = 'strong' | 'growing' | 'moderate'

export type LocationType =
  | 'locality'
  | 'railway_station'
  | 'metro'
  | 'hospital'
  | 'school'
  | 'road'
  | 'market'
  | 'landmark'

export interface CivicLocation {
  id: string
  name: string
  area: string
  city: string
  state: string
  lat: number
  lng: number
  type: LocationType
  pincode?: string
  keywords?: string[]
}

export interface AnalysisResult {
  detectedIssue: string
  category: Category
  confidence: number
  severity: Severity
  severityScore: number
  severityReason: string
  department: string
  generatedComplaint: string
  locationRisk: string
  estimatedPriority: string
  estimatedResolutionDays: number
  signals: string[]
  riskFactors: string[]
  similarReports: SimilarReport[]
  recommendedAction: string
  /** Multimodal vision analysis (only present when an image was analysed) */
  vision?: AIVisionAnalysis
  /** Transparent severity scoring breakdown */
  severityBreakdown?: SeverityBreakdownFactor[]
  /** How consistent the user's text is with the visual evidence (0-100). AI assessment, not calibrated probability. */
  evidenceMatch?: number
  /** Detected objects / labels in the uploaded image */
  detectedObjects?: DetectedObject[]
  /** Combined civic priority score (image + text + location + community) */
  priorityScore?: number
  /** Combined civic priority level label */
  priorityLevel?: string
  /** Location context (sensitive places near the selected location) */
  locationContext?: string
  /** Uploaded image quality report */
  quality?: ImageQualityReport
  /** True when a vision model could not be reached and results were produced locally */
  fallbackUsed?: boolean
}

export interface DetectedObject {
  label: string
  emoji: string
  confidence: number
  /** Normalised bounding box (0-1) — only present when the vision model provides it. Never fabricated. */
  box?: { x: number; y: number; w: number; h: number }
}

export interface SeverityBreakdownFactor {
  factor: string
  impact: number
}

export type ImageQualityStatus = 'good' | 'fair' | 'poor'

export interface ImageQualityReport {
  status: ImageQualityStatus
  dark: boolean
  blurry: boolean
  tooSmall: boolean
  lowDetail: boolean
  messages: string[]
  hasEnoughEvidence: boolean
}

export interface AIVisionAnalysis {
  detectedIssue: string
  category: Category
  severityScore: number
  severityLevel: Severity
  confidence: number
  evidenceMatch: number
  detectedFactors: string[]
  riskFactors: string[]
  detectedObjects: DetectedObject[]
  locationContext: string
  recommendedDepartment: string
  explanation: string
  recommendedActions: string[]
  severityBreakdown: SeverityBreakdownFactor[]
  enoughVisualEvidence: boolean
  evidenceNote?: string
  privacyBlurred: boolean
  privacyApplied: boolean
  source: 'vision-model' | 'local-engine'
  isModelCalibrated: boolean
  generatedAt: string
}

export interface ComplaintAIAnalysis {
  detectedIssue: string
  severityScore: number
  aiConfidence: number
  evidenceMatch: number
  detectedFactors: string[]
  severityReason: string
  recommendedDepartment: string
  aiGeneratedComplaint: string
  priorityScore: number
  priorityLevel: string
  explanation: string
  source: 'vision-model' | 'local-engine' | 'text-only'
  evidenceImages: EvidenceImageItem[]
}

export interface EvidenceImageItem {
  id: string
  name: string
  type: 'image' | 'video'
  /** Privacy-protected version used for public evidence */
  privacyUrl?: string
  thumbUrl?: string
}

export interface SimilarReport {
  id: string
  title: string
  distanceKm: number
  support: number
  status: string
}

export interface MediaItem {
  id: string
  name: string
  size: number
  type: 'image' | 'video'
  previewUrl?: string
}

export interface ReportInput {
  text: string
  media: MediaItem[]
  locationLabel: string
  privacyBlur: boolean
}

export interface TimelineEntry {
  id: string
  stage: string
  timestamp: string
  label: string
  description: string
  actor: string
  kind: 'ai' | 'authority' | 'citizen' | 'system'
  status: 'done' | 'current' | 'pending'
}

export interface CommentItem {
  id: string
  author: string
  text: string
  time: string
  safe: boolean
}

export interface EvidenceItem {
  id: string
  name: string
  type: 'image' | 'video'
  uploadedAt: string
  by: string
}

export interface AuthorityAction {
  id: string
  actor: string
  role: string
  action: string
  time: string
  kind: 'inspection' | 'crew' | 'evidence' | 'repair' | 'response' | 'update'
}

export interface Complaint {
  id: string
  title: string
  category: Category
  description: string
  location: string
  area: string
  city: string
  date: string
  reportedAt: string
  severity: Severity
  severityScore: number
  status: ComplaintStatus
  department: string
  confidence: number
  support: number
  reportCount: number
  communitySignal: boolean
  signalStrength: SignalStrength
  reporter: string
  isMine: boolean
  progress: number
  expectedAction?: string
  resolution?: {
    officialResponse: string
    aiExplanation: string
    verified?: 'yes' | 'partial' | 'no'
    citizenNote?: string
    disputed?: boolean
  }
  signal: Signal
  lat: number
  lng: number
  distanceKm?: number
  timeline: TimelineEntry[]
  comments: CommentItem[]
  evidence: EvidenceItem[]
  authorityFeed: AuthorityAction[]
  /** Persisted AI multimodal analysis attached to the complaint record */
  aiAnalysis?: ComplaintAIAnalysis
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ToastItem {
  id: string
  kind: 'success' | 'error' | 'info'
  title: string
  message?: string
}

export interface CivicArea {
  id: string
  name: string
  city: string
  pincode: string
  lat: number
  lng: number
  landmark: string
  zones: string[]
}

export interface PrivacySettings {
  blurFaces: boolean
  blurPlates: boolean
  hideName: boolean
  approximateLocation: boolean
  showNamePublic: boolean
}

export interface CivicStats {
  reportsSubmitted: number
  issuesResolved: number
  communitySignals: number
  issuesSupported: number
  level: string
}

export interface CitizenProfile {
  name: string
  email: string
  citizenId: string
  ward: string
  area: string
  city: string
  pincode: string
  joinedAt: string
  privacy: PrivacySettings
  civicStats: CivicStats
}

export interface NotificationItem {
  id: string
  kind:
    | 'priority'
    | 'resolved'
    | 'community'
    | 'status'
    | 'authority'
    | 'evidence'
    | 'nearby'
    | 'disputed'
    | 'ai'
  title: string
  message: string
  time: string
  read: boolean
  complaintId?: string
  view?: ViewKey
}

export interface CivicAlert {
  id: string
  kind: 'priority' | 'resolved' | 'community' | 'info'
  title: string
  message: string
  time: string
  complaintId?: string
}

export interface CivicInsight {
  id: string
  title: string
  body: string
  recommendation: string
  tone: 'warn' | 'good' | 'info'
  metric: string
  delta: number
}

export interface AuthorityActionFeed {
  id: string
  actor: string
  role: string
  action: string
  time: string
  kind: 'inspection' | 'crew' | 'evidence' | 'repair' | 'response' | 'update'
  area: string
}

export interface NearbyIssue {
  id: string
  title: string
  category: Category
  severity: Severity
  status: ComplaintStatus
  distanceKm: number
  support: number
  signal: Signal
  progress: number
}
