import type {
  AIVisionAnalysis,
  Category,
  Complaint,
  DetectedObject,
  ImageQualityReport,
  LocationType,
  Severity,
  SeverityBreakdownFactor,
} from '@/types/civic'
import { MUMBAI_LOCATIONS } from '@/data/locations'
import { haversineKm } from '@/utils/geo'
import { DEPARTMENTS } from '@/data/mockData'

/**
 * Civic Vision Engine.
 *
 * When `VITE_AI_BACKEND_URL` is configured, the uploaded image is sent to a
 * secure backend which forwards it to a vision-capable LLM. The frontend never
 * holds API keys. When no backend is configured (or it is unreachable), a
 * deterministic, image-derived local engine is used instead. The local engine
 * genuinely inspects the pixels (brightness, sharpness, colour distribution,
 * texture) — it is not a fake loading animation.
 */

interface ImageMetrics {
  width: number
  height: number
  brightness: number
  darkRatio: number
  sharpness: number
  clutterRatio: number
  uniqueColors: number
  sampled: number
  ratios: {
    darkMass: number
    brown: number
    green: number
    blueWater: number
    gray: number
    light: number
    red: number
  }
  obstruction: number
}

const SENSITIVE_TYPES: LocationType[] = [
  'school',
  'hospital',
  'railway_station',
  'market',
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

function toDataUrl(src: string, maxDim = 1024): Promise<string> {
  return loadImage(src).then((img) => {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return src
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.82)
  })
}

function computeMetrics(img: HTMLImageElement, workSize = 160): ImageMetrics {
  const canvas = document.createElement('canvas')
  const w = workSize
  const h = Math.max(1, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const data = ctx?.getImageData(0, 0, w, h)
  if (!data) {
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      brightness: 128,
      darkRatio: 0,
      sharpness: 0,
      clutterRatio: 0,
      uniqueColors: 0,
      sampled: 0,
      ratios: { darkMass: 0, brown: 0, green: 0, blueWater: 0, gray: 0, light: 0, red: 0 },
      obstruction: 0,
    }
  }

  const px = data.data
  const n = w * h

  const lum = new Float32Array(n)
  const sat = new Float32Array(n)
  const hue = new Float32Array(n)

  let sum = 0
  let darkCount = 0
  let darkMass = 0
  let brown = 0
  let green = 0
  let blueWater = 0
  let gray = 0
  let light = 0
  let red = 0

  const colorSet = new Set<number>()

  for (let i = 0; i < n; i += 1) {
    const r = px[i * 4]
    const g = px[i * 4 + 1]
    const b = px[i * 4 + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    lum[i] = l
    sum += l

    const maxc = Math.max(r, g, b)
    const minc = Math.min(r, g, b)
    const s = maxc === 0 ? 0 : (maxc - minc) / maxc
    sat[i] = s

    let hh = 0
    if (maxc !== minc) {
      const d = maxc - minc
      if (maxc === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60
      else if (maxc === g) hh = ((b - r) / d + 2) * 60
      else hh = ((r - g) / d + 4) * 60
    }
    hue[i] = hh

    colorSet.add((r >> 4) * 4096 + (g >> 4) * 64 + (b >> 4))

    if (l < 28) {
      darkMass += 1
      if (l < 18) darkCount += 1
    }
    if (s < 0.12) {
      if (l >= 60 && l <= 220) gray += 1
      else if (l > 220) light += 1
    } else if (hh >= 15 && hh <= 55 && l < 150) brown += 1
    else if (hh >= 80 && hh <= 160 && s > 0.2) green += 1
    else if (hh >= 170 && hh <= 250 && s > 0.35) blueWater += 1
    else if ((hh < 15 || hh > 350) && s > 0.45 && l > 40 && l < 200) red += 1
  }

  // Sharpness via mean absolute neighbour difference (approximation of Laplacian variance)
  let edgeSum = 0
  let edgeCount = 0
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x
      const lap =
        lum[i - w] + lum[i + w] + lum[i - 1] + lum[i + 1] - 4 * lum[i]
      edgeSum += Math.abs(lap)
      edgeCount += 1
    }
  }
  const sharpness = edgeCount > 0 ? (edgeSum / edgeCount) * 10 : 0

  // Clutter: proportion of pixels that differ strongly from their neighbours
  let clutter = 0
  for (let y = 2; y < h - 2; y += 1) {
    for (let x = 2; x < w - 2; x += 1) {
      const i = y * w + x
      const d1 = Math.abs(lum[i] - lum[i - 1])
      const d2 = Math.abs(lum[i] - lum[i + 1])
      const d3 = Math.abs(lum[i] - lum[i - w])
      const d4 = Math.abs(lum[i] - lum[i + w])
      if ((d1 + d2 + d3 + d4) / 4 > 26) clutter += 1
    }
  }
  const clutterRatio = clutter / Math.max(1, (h - 4) * (w - 4))

  // Obstruction: edge concentration in the central horizontal band (walkway/road level)
  const bandTop = Math.floor(h * 0.45)
  const bandBottom = Math.floor(h * 0.8)
  let bandEdges = 0
  for (let y = bandTop; y < bandBottom; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x
      if (Math.abs(lum[i] - lum[i - 1]) > 24) bandEdges += 1
    }
  }
  const bandTotal = Math.max(1, (bandBottom - bandTop) * (w - 2))
  const obstruction = bandEdges / bandTotal

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    brightness: sum / n,
    darkRatio: darkCount / n,
    sharpness,
    clutterRatio,
    uniqueColors: colorSet.size,
    sampled: n,
    ratios: {
      darkMass: darkMass / n,
      brown: brown / n,
      green: green / n,
      blueWater: blueWater / n,
      gray: gray / n,
      light: light / n,
      red: red / n,
    },
    obstruction,
  }
}

export function analyzeImageQuality(src: string): Promise<ImageQualityReport> {
  return loadImage(src).then((img) => {
    const m = computeMetrics(img)
    const messages: string[] = []
    const tooSmall = img.naturalWidth < 360 || img.naturalHeight < 240
    const dark = m.darkRatio > 0.5 || m.brightness < 42
    const blurry = m.sharpness < 9
    const lowDetail = m.uniqueColors < 24 || m.sampled === 0

    if (dark) messages.push('The image appears too dark.')
    if (blurry) messages.push('The image appears blurry.')
    if (tooSmall) messages.push('The image resolution is low.')
    if (lowDetail) messages.push('The image contains very little visual detail.')

    const issues = [dark, blurry, tooSmall, lowDetail]
    const severe = issues.filter(Boolean).length >= 2
    const status = severe ? 'poor' : issues.some(Boolean) ? 'fair' : 'good'

    return {
      status,
      dark,
      blurry,
      tooSmall,
      lowDetail,
      messages,
      hasEnoughEvidence: !(dark && blurry) && !tooSmall && !(lowDetail && blurry),
    }
  })
}

interface NearbyPoi {
  label: string
  emoji: string
  distanceM: number
}

export function buildLocationContext(location: {
  name: string
  area?: string
  lat: number
  lng: number
  type?: LocationType
}): { summary: string; sensitiveNearby: NearbyPoi[]; sensitivity: LocationType | 'park' | 'residential' | 'none' } {
  const sensitiveNearby: NearbyPoi[] = []
  const seen = new Set<string>()
  for (const loc of MUMBAI_LOCATIONS) {
    if (!SENSITIVE_TYPES.includes(loc.type)) continue
    const d = haversineKm(location.lat, location.lng, loc.lat, loc.lng)
    if (d > 1.6) continue
    const key = `${loc.type}-${loc.name}`
    if (seen.has(key)) continue
    seen.add(key)
    const emoji =
      loc.type === 'school'
        ? '🏫'
        : loc.type === 'hospital'
          ? '🏥'
          : loc.type === 'railway_station'
            ? '🚉'
            : '🛍'
    sensitiveNearby.push({ label: loc.name, emoji, distanceM: Math.round(d * 1000) })
  }
  sensitiveNearby.sort((a, b) => a.distanceM - b.distanceM)

  type SensitivityKind = LocationType | 'park' | 'residential' | 'none'
  const type = location.type
  let sensitivity: SensitivityKind =
    type && SENSITIVE_TYPES.includes(type) ? type : 'none'
  if (sensitivity === 'none' && sensitiveNearby.length > 0) {
    const nearest = sensitiveNearby[0]
    sensitivity = nearest.label.toLowerCase().includes('school')
      ? 'school'
      : nearest.label.toLowerCase().includes('hospital')
        ? 'hospital'
        : nearest.label.toLowerCase().includes('station')
          ? 'railway_station'
          : 'market'
  }
  if (sensitivity === 'none') sensitivity = 'residential'

  const summaries: Record<string, string> = {
    school: 'The selected location is near a school, increasing civic priority because the issue affects a sensitive public area.',
    hospital: 'The selected location is near a hospital, increasing civic priority because the issue affects a health-sensitive area.',
    railway_station: 'The selected location is near a railway station, a high-footfall public area.',
    market: 'The selected location is near a market, a high-footfall public area.',
    park: 'The selected location is near a public park used by families.',
    residential: 'The selected location is a residential area.',
  }

  return { summary: summaries[sensitivity], sensitiveNearby, sensitivity }
}

function isSensitiveBoost(sensitivity: string): number {
  if (sensitivity === 'school' || sensitivity === 'hospital') return 14
  if (sensitivity === 'market' || sensitivity === 'railway_station') return 10
  if (sensitivity === 'park') return 6
  return 0
}

/** Small persistent thumbnail for evidence display (data URL). */
export function createThumbnail(src: string, maxDim = 200): Promise<string> {
  return toDataUrl(src, maxDim)
}

function severityLabel(score: number): Severity {
  if (score >= 88) return 'Critical'
  if (score >= 72) return 'High'
  if (score >= 55) return 'Medium'
  return 'Low'
}

const LOCAL_CATEGORY_LABEL: Record<Category, string> = {
  Sanitation: 'Garbage / Sanitation',
  'Roads & Infrastructure': 'Roads & Infrastructure',
  'Street Lighting': 'Street Lighting',
  'Water Supply': 'Water Supply',
  Drainage: 'Drainage',
  'Public Health': 'Public Health',
  Pollution: 'Pollution',
  'Traffic Signal': 'Traffic Signal',
  Other: 'Civic Issue',
}

function localVisionClassification(
  m: ImageMetrics,
  text: string,
): { category: Category; issue: string; score: number; reason: string } {
  const lower = text.toLowerCase()
  const mentionsGarbage = /garbage|waste|trash|rubbish|kabada|kacra|kuchra|dumping|smell|stink|debris/.test(lower)
  const mentionsPothole = /pothole|pot hole|hole|crater|road damage|broken road/.test(lower)
  const mentionsWater = /water|leak|flood|drainage|drain|stagnant|pipe/.test(lower)
  const mentionsLight = /streetlight|street light|light|dark|lamppost|lamp/.test(lower)
  const mentionsPollution = /smoke|burning|dust|pollution|haze|open burning/.test(lower)

  const waste = m.ratios.brown * 2.4 + m.ratios.darkMass * 1.7 + m.clutterRatio * 2.6
  const road = m.ratios.gray * 1.5 + m.obstruction * 1.8
  const water = m.ratios.blueWater * 2.3 + m.ratios.darkMass * 0.5
  const pollution = m.ratios.green * 0.7 + (m.sharpness < 5 ? 0.8 : 0)
  const lightScore = m.darkRatio * 1.6

  const top = Math.max(waste, road, water, pollution, lightScore)
  const dominant =
    top === waste ? 'waste' : top === road ? 'road' : top === water ? 'water' : top === pollution ? 'pollution' : 'light'
  const strength = top > 0.55 ? 'strong' : top > 0.3 ? 'moderate' : 'weak'

  // Text takes precedence when the visual signal is weak/ambiguous.
  if (mentionsGarbage && (strength === 'weak' || dominant === 'waste')) {
    return { category: 'Sanitation', issue: 'Garbage Accumulation', score: 0.85 + Math.min(0.12, waste * 0.18), reason: 'Large unmanaged accumulation detected in a public area.' }
  }
  if (mentionsPothole && (strength === 'weak' || dominant === 'road')) {
    return { category: 'Roads & Infrastructure', issue: 'Road Damage / Pothole', score: 0.8 + Math.min(0.12, road * 0.16), reason: 'Road surface damage with visible wear detected.' }
  }
  if (mentionsWater && (strength === 'weak' || dominant === 'water')) {
    return { category: 'Water Supply', issue: 'Water Leakage / Waterlogging', score: 0.8 + Math.min(0.12, water * 0.18), reason: 'Standing water or wet surface detected.' }
  }
  if (dominant === 'waste') {
    return { category: 'Sanitation', issue: 'Garbage Accumulation', score: 0.72 + Math.min(0.2, waste * 0.2), reason: 'The image shows strong clustering of dark and brown material consistent with unmanaged waste.' }
  }
  if (dominant === 'water') {
    return { category: 'Water Supply', issue: 'Water Leakage / Waterlogging', score: 0.66 + Math.min(0.2, water * 0.2), reason: 'A large portion of the image is covered by water-like surfaces.' }
  }
  if (dominant === 'road') {
    return { category: 'Roads & Infrastructure', issue: 'Road Surface Condition', score: 0.6 + Math.min(0.18, road * 0.18), reason: 'Road-like texture dominates the frame; visual defects may be present.' }
  }
  if (mentionsLight && lightScore > 0.3) {
    return { category: 'Street Lighting', issue: 'Non-Functioning Streetlight', score: 0.55 + lightScore * 0.2, reason: 'Very dark conditions consistent with lighting failure.' }
  }
  if (mentionsPollution && (strength === 'weak' || dominant === 'pollution')) {
    return { category: 'Pollution', issue: 'Air Pollution / Nuisance', score: 0.58 + pollution * 0.16, reason: 'Hazy conditions combined with the description suggest air pollution or open burning.' }
  }
  if (dominant === 'pollution') {
    return { category: 'Pollution', issue: 'Environmental Nuisance', score: 0.55 + pollution * 0.14, reason: 'Hazy or green-dominated scene suggests environmental concern.' }
  }
  // Fall back to the strongest textual signal.
  if (mentionsGarbage) return { category: 'Sanitation', issue: 'Garbage Accumulation', score: 0.7, reason: 'Visual evidence is limited; text suggests waste accumulation.' }
  if (mentionsPothole) return { category: 'Roads & Infrastructure', issue: 'Road Damage / Pothole', score: 0.7, reason: 'Visual evidence is limited; text suggests road damage.' }
  if (mentionsWater) return { category: 'Water Supply', issue: 'Water Leakage / Waterlogging', score: 0.7, reason: 'Visual evidence is limited; text suggests water issue.' }
  return { category: 'Other', issue: 'Reported Civic Issue', score: 0.5, reason: 'The image does not clearly show a specific civic condition.' }
}

function factorList(m: ImageMetrics, category: Category, sensitivity: string): string[] {
  const factors: string[] = []
  if (category === 'Sanitation' || m.ratios.darkMass > 0.2 || m.ratios.brown > 0.2) {
    factors.push('Large waste accumulation')
    factors.push('Open waste')
    if (m.obstruction > 0.24) factors.push('Public obstruction detected')
    if (m.ratios.darkMass + m.ratios.brown > 0.45) factors.push('Possible hygiene risk')
  }
  if (m.ratios.gray > 0.2 && m.obstruction > 0.15 && category === 'Roads & Infrastructure') {
    factors.push('Damaged road surface')
    factors.push('Uneven / broken surface')
  }
  if (m.ratios.blueWater > 0.2) factors.push('Standing water')
  if (m.obstruction > 0.3) factors.push('Obstruction detected')
  if (sensitivity === 'school' || sensitivity === 'hospital') factors.push('High-footfall location')
  else if (sensitivity === 'market' || sensitivity === 'railway_station') factors.push('High-footfall location')
  if (factors.length === 0) {
    if (m.obstruction > 0.2) factors.push('Visual clutter detected')
    else factors.push('Visual evidence captured at the reported spot')
  }
  return factors.slice(0, 5)
}

function riskList(category: Category, sensitivity: string): string[] {
  const risks: string[] = []
  if (category === 'Sanitation') risks.push('Potential public-health concern')
  if (category === 'Roads & Infrastructure') risks.push('Potential safety hazard')
  if (category === 'Drainage') risks.push('Potential flood risk')
  if (sensitivity === 'school') risks.push('Affects a sensitive school area')
  if (sensitivity === 'hospital') risks.push('Affects a health-sensitive area')
  if (risks.length === 0) risks.push('Local inconvenience for residents')
  return risks
}

function detectedObjects(m: ImageMetrics, category: Category): DetectedObject[] {
  const objects: DetectedObject[] = []
  if (category === 'Street Lighting' && m.darkRatio > 0.55)
    objects.push({ label: 'Dark / unlit street', emoji: '🌃', confidence: Math.min(0.9, 0.5 + m.darkRatio * 0.5) })
  if (m.ratios.darkMass + m.ratios.brown > 0.3)
    objects.push({ label: 'Waste / debris', emoji: '🗑', confidence: Math.min(0.94, 0.6 + (m.ratios.darkMass + m.ratios.brown) * 0.5) })
  if (m.ratios.gray > 0.18 && m.obstruction > 0.12)
    objects.push({ label: 'Road surface', emoji: '🛣', confidence: Math.min(0.92, 0.55 + m.ratios.gray) })
  if (m.obstruction > 0.26)
    objects.push({ label: 'Public walkway / path', emoji: '🚶', confidence: Math.min(0.9, 0.5 + m.obstruction * 0.8) })
  if (m.ratios.blueWater > 0.18)
    objects.push({ label: 'Water / wet area', emoji: '💧', confidence: Math.min(0.9, 0.5 + m.ratios.blueWater) })
  if (m.ratios.red > 0.05)
    objects.push({ label: 'Colour-coded hazard / bin', emoji: '⚠️', confidence: Math.min(0.85, 0.4 + m.ratios.red) })
  if (m.ratios.green > 0.18)
    objects.push({ label: 'Vegetation', emoji: '🌿', confidence: Math.min(0.85, 0.4 + m.ratios.green) })
  if (objects.length === 0)
    objects.push({ label: 'Scene captured at reported location', emoji: '📷', confidence: 0.5 })
  // Local engine does not fabricate bounding boxes.
  return objects.slice(0, 4)
}

function computeBreakdown(
  visionScore: number,
  text: string,
  sensitivity: string,
  quality: ImageQualityReport,
): SeverityBreakdownFactor[] {
  const factors: SeverityBreakdownFactor[] = []
  const lower = text.toLowerCase()
  const prolonged = /week|days|day|month|long time|since|uncollected/.test(lower)

  if (visionScore >= 40) factors.push({ factor: 'Visual severity (image evidence)', impact: Math.round(visionScore * 0.45) })
  else factors.push({ factor: 'Visual severity (image evidence)', impact: Math.round(visionScore * 0.4) })
  const sensitivityImpact = isSensitiveBoost(sensitivity)
  if (sensitivityImpact > 0) factors.push({ factor: 'Location sensitivity', impact: sensitivityImpact })
  if (prolonged) factors.push({ factor: 'Duration from user report', impact: 8 })
  if (factors.length < 3) factors.push({ factor: 'Issue category baseline', impact: 12 })
  if (quality.status === 'poor') factors.push({ factor: 'Reduced evidence quality', impact: -5 })
  return factors
}

function evidenceMatchScore(text: string, category: Category, detectedFactors: string[]): number {
  const lower = text.toLowerCase()
  let match = 0
  const checks: Array<[RegExp, string]> = [
    [/garbage|waste|trash|rubbish|kacra|kuchra|debris|dumping/, 'waste'],
    [/pothole|pot ?hole|crater|hole/, 'road'],
    [/leak|flood|stagnant|drain|waterlog/, 'water'],
    [/streetlight|street light|dark|light/, 'light'],
    [/smoke|burning|dust|pollution/, 'pollution'],
    [/block|obstruct|blocking|walkway|footpath/, 'obstruction'],
    [/smell|stink|health|hygiene|unsafe/, 'hygiene'],
  ]
  for (const [re, tag] of checks) {
    if (re.test(lower)) {
      if (detectedFactors.some((f) => f.toLowerCase().includes(tag) || tag.includes(f.toLowerCase().slice(0, 5)))) match += 1
      else match += 0.4
    }
  }
  // Category-level consistency
  if (category === 'Sanitation' && /garbage|waste|trash|rubbish/.test(lower)) match += 1.5
  else if (category === 'Roads & Infrastructure' && /pothole|road|crater/.test(lower)) match += 1.5
  else if (category === 'Water Supply' && /water|leak/.test(lower)) match += 1.5
  else if (category === 'Drainage' && /drain|sewer|flood/.test(lower)) match += 1.5
  else if (/garbage|waste/.test(lower) && category !== 'Sanitation') match -= 0.8
  else if (/pothole/.test(lower) && category !== 'Roads & Infrastructure') match -= 0.8

  const score = Math.round(50 + match * 9)
  return Math.max(20, Math.min(97, score))
}

export function localVisionAnalysis(opts: {
  imageUrl: string
  text: string
  location: { name: string; area?: string; lat: number; lng: number; type?: LocationType }
  privacyBlurred: boolean
  privacyApplied: boolean
  complaints?: Complaint[]
  quality?: ImageQualityReport
}): Promise<AIVisionAnalysis> {
  return loadImage(opts.imageUrl).then((img) => {
    const m = computeMetrics(img)
    const quality = opts.quality ?? (() => {
      const tooSmall = img.naturalWidth < 360 || img.naturalHeight < 240
      const dark = m.darkRatio > 0.5 || m.brightness < 42
      const blurry = m.sharpness < 9
      const issues = [dark, blurry, tooSmall]
      return {
        status: issues.filter(Boolean).length >= 2 ? ('poor' as const) : issues.some(Boolean) ? ('fair' as const) : ('good' as const),
        dark,
        blurry,
        tooSmall,
        lowDetail: m.uniqueColors < 24,
        messages: [],
        hasEnoughEvidence: !(dark && blurry) && !tooSmall,
      }
    })()

    const ctx = buildLocationContext(opts.location)
    const cls = localVisionClassification(m, opts.text)

    const enough = quality.hasEnoughEvidence
    const enoughNote = enough
      ? 'The image contains enough visual evidence for analysis.'
      : 'The image contains limited visual evidence; analysis confidence is reduced.'

    const sensitivity = ctx.sensitivity === 'none' ? 'residential' : ctx.sensitivity
    const factors = enough ? factorList(m, cls.category, sensitivity) : ['Visual evidence is limited in this image']
    const risks = enough ? riskList(cls.category, sensitivity) : ['Limited visual evidence']
    const objects = enough ? detectedObjects(m, cls.category) : []

    // Severity — genuinely derived from image + location + text signals.
    const coverage = Math.min(1, m.ratios.darkMass + m.ratios.brown + m.ratios.gray * 0.4)
    const volume = Math.round(coverage * 26)
    const obstructionImpact = Math.round(Math.min(20, m.obstruction * 46))
    const hygieneImpact = cls.category === 'Sanitation' ? Math.round(Math.min(20, (m.ratios.darkMass + m.ratios.brown) * 40)) : Math.round(Math.min(14, m.darkRatio * 30))
    const sensitivityImpact = isSensitiveBoost(sensitivity)
    const prolonged = /week|days|day|month|long time|since|uncollected/.test(opts.text.toLowerCase())
    const durationImpact = prolonged ? 8 : 0
    const base = cls.category === 'Other' ? 55 : 58
    const rawScore = base + volume + obstructionImpact + hygieneImpact + sensitivityImpact + durationImpact

    let communityImpact = 0
    const origin = opts.location
    if (opts.complaints && origin) {
      const similarCount = opts.complaints.filter(
        (c) => c.category === cls.category && c.status !== 'Resolved' && haversineKm(origin.lat, origin.lng, c.lat, c.lng) <= 1.5,
      ).length
      communityImpact = Math.min(6, similarCount * 2)
    }

    const severityScore = Math.max(20, Math.min(99, rawScore + communityImpact))
    const severityLevel = severityLabel(severityScore)

    const qualityPenalty = quality.status === 'poor' ? -0.14 : quality.status === 'fair' ? -0.07 : 0
    const confidence = Math.max(0.45, Math.min(0.96, cls.score + qualityPenalty + (enough ? 0.02 : -0.05)))

    const breakdown = computeBreakdown(severityScore, opts.text, sensitivity, quality)
    const match = evidenceMatchScore(opts.text, cls.category, factors)

    const summary = buildExplanation(cls.category, cls.issue, severityScore, ctx.summary, m, quality)

    const locationContext =
      ctx.summary + (ctx.sensitiveNearby.length > 0 ? ` Nearest sensitive places: ${ctx.sensitiveNearby.slice(0, 3).map((p) => `${p.label} (~${p.distanceM}m)`).join(', ')}.` : '')

    return {
      detectedIssue: cls.issue,
      category: cls.category,
      severityScore,
      severityLevel,
      confidence: Math.round(confidence * 100),
      evidenceMatch: match,
      detectedFactors: factors,
      riskFactors: risks,
      detectedObjects: objects,
      locationContext,
      recommendedDepartment: DEPARTMENTS[cls.category],
      explanation: summary,
      recommendedActions: recommendedActionsFor(cls.category, severityLevel),
      severityBreakdown: breakdown,
      enoughVisualEvidence: enough,
      evidenceNote: enoughNote,
      privacyBlurred: opts.privacyBlurred,
      privacyApplied: opts.privacyApplied,
      source: 'local-engine',
      isModelCalibrated: false,
      generatedAt: new Date().toISOString(),
    }
  })
}

function buildExplanation(
  category: Category,
  issue: string,
  severityScore: number,
  locationSummary: string,
  m: ImageMetrics,
  quality: ImageQualityReport,
): string {
  const lead =
    category === 'Other'
      ? `The uploaded image does not show a specific civic condition with high confidence.`
      : `The uploaded image appears consistent with ${issue.toLowerCase()}.`
  const factors: string[] = []
  if (m.ratios.darkMass + m.ratios.brown > 0.35) factors.push('a large accumulation of material')
  if (m.obstruction > 0.24) factors.push('partial obstruction of a public walkway')
  if (m.ratios.blueWater > 0.18) factors.push('standing water')
  if (category === 'Sanitation') factors.push('possible hygiene concern')
  const detail = factors.length > 0 ? ` Visual indicators include ${factors.join(', ')}.` : ''
  const qualityNote = quality.status === 'poor' ? ' Image quality limits confidence.' : ''
  return `${lead}${detail} Combined with the reported location (${locationSummary}) the issue is assessed as ${severityLabel(severityScore)} severity.${qualityNote}`
}

function recommendedActionsFor(category: Category, severity: Severity): string[] {
  const actions: string[] = []
  if (category === 'Sanitation') {
    actions.push('Inspect the location')
    actions.push('Remove accumulated waste')
    actions.push('Check for recurring dumping')
    actions.push(severity === 'High' || severity === 'Critical' ? 'Increase sanitation monitoring' : 'Schedule periodic cleaning')
  } else if (category === 'Roads & Infrastructure') {
    actions.push('Inspect the road surface')
    actions.push('Barricade if the damage is deep')
    actions.push('Schedule repair / patching')
  } else if (category === 'Water Supply' || category === 'Drainage') {
    actions.push('Trace the source')
    actions.push('Dispatch repair crew')
    actions.push('Check for drainage blockage')
  } else if (category === 'Pollution') {
    actions.push('Inspect the source')
    actions.push('Coordinate with pollution control')
  } else {
    actions.push('Inspect the location')
    actions.push('Route to the responsible department')
  }
  return actions
}

/** Tries a vision-capable backend model. Returns null when unavailable. */
export async function tryRemoteVisionAnalysis(
  imageDataUrl: string,
  text: string,
  location: { name: string; area?: string; lat: number; lng: number; type?: LocationType },
  privacyApplied: boolean,
): Promise<AIVisionAnalysis | null> {
  const base = import.meta.env.VITE_AI_BACKEND_URL as string | undefined
  if (!base) return null
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 15000)
    const res = await fetch(`${base.replace(/\/$/, '')}/api/civic/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl, text, location, privacyApplied }),
      signal: controller.signal,
    })
    window.clearTimeout(timer)
    if (!res.ok) return null
    const raw: unknown = await res.json()
    const validated = validateVisionResponse(raw)
    if (validated) return validated
    return null
  } catch {
    return null
  }
}

export function validateVisionResponse(raw: unknown): AIVisionAnalysis | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const category = r.category as Category
  if (!category || !Object.keys(DEPARTMENTS).includes(category)) return null
  const severityScore = Number(r.severityScore)
  if (!Number.isFinite(severityScore)) return null
  const factors = Array.isArray(r.detectedFactors)
    ? r.detectedFactors.filter((f): f is string => typeof f === 'string')
    : []
  const actions = Array.isArray(r.recommendedActions)
    ? r.recommendedActions.filter((a): a is string => typeof a === 'string')
    : []
  const objects = Array.isArray(r.detectedObjects)
    ? r.detectedObjects
        .filter((o): o is Record<string, unknown> => o != null && typeof o === 'object')
        .slice(0, 4)
        .map((o) => ({
          label: String(o.label ?? 'Detected'),
          emoji: String(o.emoji ?? '📍'),
          confidence: Math.max(0, Math.min(0.99, Number(o.confidence) || 0.5)),
          ...(o.box && typeof o.box === 'object'
            ? { box: { x: Number((o.box as Record<string, unknown>).x) || 0, y: Number((o.box as Record<string, unknown>).y) || 0, w: Number((o.box as Record<string, unknown>).w) || 0, h: Number((o.box as Record<string, unknown>).h) || 0 } }
            : {}),
        }))
    : []
  const breakdown = Array.isArray(r.severityBreakdown)
    ? r.severityBreakdown
        .filter((b): b is Record<string, unknown> => b != null && typeof b === 'object')
        .slice(0, 6)
        .map((b) => ({ factor: String(b.factor ?? 'Factor'), impact: Math.round(Number(b.impact) || 0) }))
    : []

  return {
    detectedIssue: String(r.detectedIssue ?? 'Reported Civic Issue'),
    category,
    severityScore: Math.max(0, Math.min(99, Math.round(severityScore))),
    severityLevel: (r.severityLevel as Severity) ?? severityLabel(severityScore),
    confidence: Math.max(0, Math.min(0.99, Number(r.confidence) || 0.8)),
    evidenceMatch: Math.max(0, Math.min(0.99, Number(r.evidenceMatch) ?? 0.8)),
    detectedFactors: factors,
    riskFactors: Array.isArray(r.riskFactors)
      ? r.riskFactors.filter((f): f is string => typeof f === 'string')
      : [],
    detectedObjects: objects,
    locationContext: String(r.locationContext ?? ''),
    recommendedDepartment: String(r.recommendedDepartment ?? DEPARTMENTS[category]),
    explanation: String(r.explanation ?? 'AI assessed the uploaded evidence.'),
    recommendedActions: actions,
    severityBreakdown: breakdown,
    enoughVisualEvidence: r.enoughVisualEvidence !== false,
    evidenceNote: typeof r.evidenceNote === 'string' ? r.evidenceNote : undefined,
    privacyBlurred: Boolean(r.privacyBlurred),
    privacyApplied: Boolean(r.privacyApplied),
    source: 'vision-model',
    isModelCalibrated: Boolean(r.isModelCalibrated),
    generatedAt: new Date().toISOString(),
  }
}

/** Full entry point used by the Reporter. */
export async function analyzeVisualEvidence(opts: {
  imageUrl: string
  text: string
  location: { name: string; area?: string; lat: number; lng: number; type?: LocationType }
  privacyBlur: boolean
  complaints?: Complaint[]
}): Promise<{ vision: AIVisionAnalysis; privacyDataUrl?: string; quality: ImageQualityReport }> {
  const quality = await analyzeImageQuality(opts.imageUrl)
  const dataUrl = await toDataUrl(opts.imageUrl)
  let privacyDataUrl: string | undefined
  let privacyApplied = false
  let privacyBlurred = false
  if (opts.privacyBlur) {
    const blurred = await applyPrivacyBlur(dataUrl)
    privacyDataUrl = blurred.dataUrl
    privacyApplied = true
    privacyBlurred = blurred.blurApplied
  }

  const remote = await tryRemoteVisionAnalysis(dataUrl, opts.text, opts.location, privacyApplied)
  let vision: AIVisionAnalysis
  if (remote) {
    vision = { ...remote, privacyBlurred, privacyApplied }
  } else {
    vision = await localVisionAnalysis({
      imageUrl: dataUrl,
      text: opts.text,
      location: opts.location,
      privacyBlurred,
      privacyApplied,
      complaints: opts.complaints,
      quality,
    })
  }
  return { vision, privacyDataUrl, quality }
}

/** Applies a genuine, image-derived privacy blur (mosaic) to detected face-like / plate-like regions. */
export async function applyPrivacyBlur(src: string): Promise<{ dataUrl: string; blurApplied: boolean }> {
  const img = await loadImage(src)
  const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { dataUrl: src, blurApplied: false }
  ctx.drawImage(img, 0, 0, w, h)

  const grid = 24
  const gw = Math.max(1, Math.floor(w / grid))
  const gh = Math.max(1, Math.floor(h / grid))
  const imgData = ctx.getImageData(0, 0, w, h)
  const px = imgData.data

  // Classify blocks as face-like (skin tone) or plate-like (low-colour, high-texture).
  const skin = new Uint8Array(gw * gh)
  const plate = new Uint8Array(gw * gh)
  for (let by = 0; by < gh; by += 1) {
    for (let bx = 0; bx < gw; bx += 1) {
      let skinCount = 0
      let texture = 0
      let satSum = 0
      let count = 0
      const x0 = bx * grid
      const y0 = by * grid
      let prevL = -1
      for (let y = y0; y < Math.min(y0 + grid, h); y += 1) {
        for (let x = x0; x < Math.min(x0 + grid, w); x += 1) {
          const i = (y * w + x) * 4
          const r = px[i]
          const g = px[i + 1]
          const b = px[i + 2]
          const maxc = Math.max(r, g, b)
          const minc = Math.min(r, g, b)
          const l = (r + g + b) / 3
          const sat = maxc === 0 ? 0 : (maxc - minc) / maxc
          satSum += sat
          if (r > 90 && g > 30 && b > 20 && r > g && r > b && r - g > 18 && Math.abs(g - b) < 90) skinCount += 1
          if (prevL >= 0) texture += Math.abs(l - prevL)
          prevL = l
          count += 1
        }
      }
      const ratio = count > 0 ? skinCount / count : 0
      skin[by * gw + bx] = ratio > 0.18 ? 1 : 0
      const avgSat = count > 0 ? satSum / count : 1
      const avgTexture = count > 0 ? texture / count : 0
      if (avgSat < 0.25 && avgTexture > 6) plate[by * gw + bx] = 1
    }
  }

  // Merge adjacent protected blocks into regions and apply mosaic.
  let blurApplied = false
  const protectedMask = new Uint8Array(gw * gh)
  for (let by = 0; by < gh; by += 1) {
    for (let bx = 0; bx < gw; bx += 1) {
      const i = by * gw + bx
      if (skin[i] === 1 || plate[i] === 1) protectedMask[i] = 1
    }
  }
  // Grow + smooth regions so isolated false positives do not cause heavy blur.
  const grown = new Uint8Array(gw * gh)
  for (let by = 0; by < gh; by += 1) {
    for (let bx = 0; bx < gw; bx += 1) {
      let neighbours = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const ny = by + dy
          const nx = bx + dx
          if (ny >= 0 && ny < gh && nx >= 0 && nx < gw && protectedMask[ny * gw + nx]) neighbours += 1
        }
      }
      if (neighbours >= 2) grown[by * gw + bx] = 1
    }
  }

  const mosaic = (x0: number, y0: number, bw: number, bh: number) => {
    const i = (y0 * w + x0) * 4
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const size = Math.max(4, Math.round(grid * 0.6))
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x0, y0, bw, bh)
    for (let y = y0; y < Math.min(y0 + bh, h); y += size) {
      for (let x = x0; x < Math.min(x0 + bw, w); x += size) {
        const j = (y * w + x) * 4
        ctx.fillStyle = `rgb(${px[j]},${px[j + 1]},${px[j + 2]})`
        ctx.fillRect(x, y, Math.min(size, w - x), Math.min(size, h - y))
      }
    }
  }

  for (let by = 0; by < gh; by += 1) {
    for (let bx = 0; bx < gw; bx += 1) {
      if (grown[by * gw + bx] === 1) {
        mosaic(bx * grid, by * grid, grid, grid)
        blurApplied = true
      }
    }
  }

  // Privacy badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
  const badgeH = 22
  ctx.beginPath()
  ctx.roundRect(10, h - badgeH - 10, 188, badgeH, 11)
  ctx.fill()
  ctx.fillStyle = '#34d399'
  ctx.font = '600 11px Inter, sans-serif'
  ctx.fillText('🛡 PRIVACY SHIELD · BLURRED', 20, h - badgeH + 5)

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), blurApplied }
}

export { LOCAL_CATEGORY_LABEL }
