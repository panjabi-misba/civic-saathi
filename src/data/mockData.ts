import type {
  AuthorityActionFeed,
  Category,
  CivicAlert,
  CivicArea,
  CivicInsight,
  CommentItem,
  Complaint,
  Language,
  NotificationItem,
  Signal,
  SignalStrength,
  TimelineEntry,
} from '@/types/civic'

export const DEPARTMENTS: Record<Category, string> = {
  Sanitation: 'Municipal Sanitation Department',
  'Roads & Infrastructure': 'Roads & Infrastructure Department',
  'Street Lighting': 'Electrical Maintenance Department',
  'Water Supply': 'Water Supply & Sewerage Department',
  Drainage: 'Drainage & Stormwater Department',
  'Public Health': 'Public Health Department',
  Pollution: 'Environment & Pollution Control Department',
  'Traffic Signal': 'Traffic Engineering Department',
  Other: 'Municipal Grievance Cell',
}

export const SEVERITY_META: Record<
  string,
  { color: string; bg: string; dot: string }
> = {
  Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', dot: '#EF4444' },
  High: { color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', dot: '#F59E0B' },
  Medium: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', dot: '#10B981' },
  Low: { color: '#64748B', bg: 'rgba(100,116,139,0.12)', dot: '#64748B' },
}

export const STATUS_ORDER = [
  'Reported',
  'AI Verified',
  'Assigned',
  'In Progress',
  'Resolved',
] as const

export const SIGNAL_META: Record<Signal, { label: string; color: string; emoji: string }> = {
  garbage: { label: 'Garbage', color: '#EF4444', emoji: '🔴' },
  pothole: { label: 'Pothole', color: '#F97316', emoji: '🟠' },
  streetlight: { label: 'Streetlight', color: '#F59E0B', emoji: '🟡' },
  water: { label: 'Water Leakage', color: '#3B82F6', emoji: '🔵' },
  drainage: { label: 'Drainage', color: '#8B5CF6', emoji: '🟣' },
  pollution: { label: 'Pollution', color: '#64748B', emoji: '⚪' },
  traffic: { label: 'Traffic Signal', color: '#0EA5E9', emoji: '🚦' },
}

export const SIGNAL_ORDER: Signal[] = [
  'garbage',
  'pothole',
  'streetlight',
  'water',
  'drainage',
  'pollution',
  'traffic',
]

const NOW = new Date('2026-08-10T12:00:00')

function iso(daysAgo: number, hours = 10, mins = 0): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hours, mins, 0, 0)
  return d.toISOString()
}

function fmt(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function progressForStatus(status: Complaint['status']): number {
  switch (status) {
    case 'Reported':
      return 10
    case 'AI Verified':
      return 25
    case 'Assigned':
      return 42
    case 'In Progress':
      return 72
    case 'Resolved':
      return 100
    case 'Citizen Disputed':
      return 60
  }
}

export function expectedActionFor(status: Complaint['status'], category: Category): string {
  switch (status) {
    case 'Reported':
      return 'AI verification expected within the hour'
    case 'AI Verified':
      return 'Department assignment expected today'
    case 'Assigned':
      return 'Field inspection scheduled shortly'
    case 'In Progress':
      return category === 'Street Lighting'
        ? 'Repair crew expected within 48 hours'
        : 'Work completion expected within 72 hours'
    case 'Resolved':
      return 'Awaiting your final verification'
    case 'Citizen Disputed':
      return 'Escalated back to the department for re-inspection'
  }
}

interface TLB {
  id: string
  category: Category
  reportedAt: string
  status: Complaint['status']
  department: string
  area: string
  verified?: 'yes' | 'partial' | 'no'
}

function buildTimeline(t: TLB): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const rep = new Date(t.reportedAt)
  const add = (stage: string, dayOff: number, hour: number, minute: number, label: string, description: string, actor: string, kind: TimelineEntry['kind']) => {
    const d = new Date(rep)
    d.setDate(d.getDate() + dayOff)
    d.setHours(hour, minute, 0, 0)
    entries.push({
      id: `${t.id}-${stage}`,
      stage,
      timestamp: d.toISOString(),
      label,
      description,
      actor,
      kind,
      status: 'done',
    })
  }

  add('Reported', 0, 10, 15, 'Complaint Submitted', `Report filed by a citizen from ${t.area} with supporting evidence.`, 'Civic Saathi Platform', 'system')
  add('AI Verified', 0, 10, 42, 'AI Verified', `Civic Saathi classified this as a ${t.category.toLowerCase()} complaint and verified its details.`, 'Civic Saathi AI', 'ai')
  if (t.status === 'Reported') {
    entries[1].status = 'current'
    return entries
  }
  add('Assigned', 1, 9, 30, 'Department Identified', `Forwarded to ${t.department} and ${t.area} Ward Office.`, `${t.area} Ward Office`, 'authority')
  if (t.status === 'AI Verified') {
    entries[2].status = 'current'
    return entries
  }
  if (t.status === 'Citizen Disputed') {
    add('Assigned', 1, 9, 30, 'Department Identified', `Forwarded to ${t.department} and ${t.area} Ward Office.`, `${t.area} Ward Office`, 'authority')
    add('In Progress', 3, 11, 5, 'Work Started', 'Field team began remedial work on site.', 'Field Operations Team', 'authority')
    add('Disputed', 4, 16, 20, 'Citizen Disputed Resolution', 'A citizen reported the issue is still not fully resolved and uploaded new evidence.', 'Citizen', 'citizen')
    entries[entries.length - 1].status = 'current'
    return entries
  }
  add('Inspection Scheduled', 2, 11, 0, 'Inspection Scheduled', `Site inspection scheduled by the ${t.area} ward inspector.`, `${t.area} Ward Office`, 'authority')
  if (t.status === 'Assigned') {
    entries[3].status = 'current'
    return entries
  }
  add('In Progress', 3, 11, 5, 'Work Started', 'Field team began remedial work on site. Progress is being tracked live.', 'Field Operations Team', 'authority')
  if (t.status === 'In Progress') {
    entries[4].status = 'current'
    return entries
  }
  add('Resolved', 5, 14, 30, 'Resolved', 'The department marked this issue as resolved after remedial work.', t.department, 'authority')
  if (t.verified) {
    const label =
      t.verified === 'yes'
        ? 'Citizen Verified'
        : t.verified === 'partial'
          ? 'Partially Verified'
          : 'Citizen Disputed Resolution'
    add(
      'Citizen Verification',
      6,
      10,
      5,
      label,
      t.verified === 'yes'
        ? 'The reporting citizen confirmed the problem has been fixed.'
        : t.verified === 'partial'
          ? 'The citizen confirmed partial improvement only.'
          : 'The citizen reported the issue is not fixed and reopened it with evidence.',
      'Citizen',
      'citizen',
    )
    entries[entries.length - 1].status = t.verified === 'no' ? 'current' : 'done'
    if (t.verified === 'no') entries[5].status = 'done'
  }
  return entries
}

function buildAuthorityFeed(
  category: Category,
  status: Complaint['status'],
  area: string,
): AuthorityActionFeed[] {
  const feed: AuthorityActionFeed[] = []
  if (status === 'In Progress' || status === 'Resolved' || status === 'Citizen Disputed') {
    feed.push({
      id: `af-${area}-1`,
      actor: 'Ward Officer',
      role: `${area} Ward Office`,
      action: 'Inspection completed and remediation plan approved.',
      time: 'Yesterday, 11:30 AM',
      kind: 'inspection',
      area,
    })
    feed.push({
      id: `af-${area}-2`,
      actor: category === 'Sanitation' || category === 'Pollution' ? 'Sanitation Crew' : 'Municipal Team',
      role: category === 'Sanitation' ? 'Municipal Sanitation Department' : 'Field Operations',
      action:
        category === 'Sanitation'
          ? 'Cleaning crew assigned to the affected spot.'
          : 'Repair work started at the reported location.',
      time: 'Today, 9:05 AM',
      kind: 'crew',
      area,
    })
    feed.push({
      id: `af-${area}-3`,
      actor: 'Field Engineer',
      role: 'Quality & Monitoring',
      action: 'Before / after imagery captured and logged to the complaint record.',
      time: 'Today, 10:40 AM',
      kind: 'evidence',
      area,
    })
  }
  return feed
}

function comments(): CommentItem[] {
  return [
    {
      id: Math.random().toString(36).slice(2),
      author: 'Rahul P.',
      text: 'Still happening every morning. Hope this gets priority.',
      time: '2 hrs ago',
      safe: true,
    },
    {
      id: Math.random().toString(36).slice(2),
      author: 'Meera K.',
      text: 'Cleaning was done yesterday but waste has returned overnight.',
      time: '1 hr ago',
      safe: true,
    },
    {
      id: Math.random().toString(36).slice(2),
      author: 'Anand V.',
      text: 'This has been an issue in the area for months now.',
      time: '45 min ago',
      safe: true,
    },
  ]
}

interface Cfg {
  id: string
  title: string
  category: Category
  description: string
  location: string
  area: string
  city: string
  daysAgo: number
  severity: Complaint['severity']
  severityScore: number
  status: Complaint['status']
  confidence: number
  support: number
  reportCount: number
  communitySignal: boolean
  signalStrength: SignalStrength
  signal: Signal
  lat: number
  lng: number
  verified?: 'yes' | 'partial' | 'no'
  reporter?: string
  isMine?: boolean
  officialResponse?: string
  aiExplanation?: string
}

function mk(c: Cfg): Complaint {
  const reportedAt = iso(c.daysAgo, 9 + (c.daysAgo % 6), (c.id.charCodeAt(c.id.length - 1) % 50))
  const baseTimeline = buildTimeline({
    id: c.id,
    category: c.category,
    reportedAt,
    status: c.status,
    department: DEPARTMENTS[c.category],
    area: c.area,
    verified: c.verified,
  })
  const timeline = c.isMine ? baseTimeline : baseTimeline
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    description: c.description,
    location: c.location,
    area: c.area,
    city: c.city,
    date: reportedAt.slice(0, 10),
    reportedAt,
    severity: c.severity,
    severityScore: c.severityScore,
    status: c.status,
    department: DEPARTMENTS[c.category],
    confidence: c.confidence,
    support: c.support,
    reportCount: c.reportCount,
    communitySignal: c.communitySignal,
    signalStrength: c.signalStrength,
    reporter: c.reporter ?? (c.isMine ? 'You' : 'Anonymous Citizen'),
    isMine: c.isMine ?? false,
    progress: progressForStatus(c.status),
    expectedAction: expectedActionFor(c.status, c.category),
    resolution:
      c.status === 'Resolved' || c.verified || c.status === 'Citizen Disputed'
        ? {
            officialResponse:
              c.officialResponse ??
              'The concerned department has completed remedial action at the site and requests the complainant to verify the same.',
            aiExplanation:
              c.aiExplanation ??
              'The department says the work is complete. Please check the location and confirm whether the problem is genuinely fixed — or reopen it with new evidence.',
            verified: c.verified,
            disputed: c.status === 'Citizen Disputed',
          }
        : {
            officialResponse:
              'The grievance has been forwarded to the concerned ward authority for necessary action.',
            aiExplanation:
              'Your complaint has been sent to the local ward office. They are responsible for taking action and will update progress here.',
          },
    signal: c.signal,
    lat: c.lat,
    lng: c.lng,
    timeline,
    comments: comments(),
    evidence:
      c.isMine || c.reporter === 'You'
        ? [{ id: `ev-${c.id}-1`, name: 'site-photo.jpg', type: 'image', uploadedAt: reportedAt, by: 'You' }]
        : [],
    authorityFeed: buildAuthorityFeed(c.category, c.status, c.area),
  }
}

export const INITIAL_COMPLAINTS: Complaint[] = [
  mk({
    id: 'CS-MUM-BAN-2026-00182',
    title: 'Garbage accumulation near Bandra Market',
    category: 'Sanitation',
    description:
      'Large quantities of uncollected waste have accumulated at the edge of Bandra Market for over four days, creating a strong odour and attracting strays. Shopkeepers and residents have raised health concerns.',
    location: 'Near Bandra Market, Linking Road',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 4,
    severity: 'High',
    severityScore: 87,
    status: 'In Progress',
    confidence: 96,
    support: 23,
    reportCount: 12,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'garbage',
    lat: 19.0599,
    lng: 72.8394,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00179',
    title: 'Deep pothole on Linking Road',
    category: 'Roads & Infrastructure',
    description:
      'A wide pothole on Linking Road near the Bandra West junction has damaged at least four two-wheelers in the last week. It fills with rainwater and is barely visible at night.',
    location: 'Linking Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 6,
    severity: 'High',
    severityScore: 84,
    status: 'Assigned',
    confidence: 94,
    support: 27,
    reportCount: 14,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'pothole',
    lat: 19.0579,
    lng: 72.8402,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00174',
    title: 'Streetlight failure on Hill Road stretch',
    category: 'Street Lighting',
    description:
      'Three consecutive streetlights are dark on Hill Road near the Pali Hill junction. The stretch feels unsafe for pedestrians and two-wheeler riders after 8 PM.',
    location: 'Hill Road, Pali Hill junction',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 7,
    severity: 'Medium',
    severityScore: 64,
    status: 'Assigned',
    confidence: 91,
    support: 11,
    reportCount: 6,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'streetlight',
    lat: 19.0638,
    lng: 72.8284,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00171',
    title: 'Heavy water leakage near Bandra West',
    category: 'Water Supply',
    description:
      'A major water pipeline leak is flooding the lane near Bandra West, wasting a large volume of treated water and creating slippery, hazardous walking surfaces near homes.',
    location: 'Bandra West, near Reclamation',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 2,
    severity: 'Critical',
    severityScore: 93,
    status: 'AI Verified',
    confidence: 97,
    support: 41,
    reportCount: 26,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'water',
    lat: 19.044,
    lng: 72.8255,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00167',
    title: 'Open manhole without safety guard',
    category: 'Drainage',
    description:
      'An uncovered manhole near the Bandra Station footpath has no warning sign or guard. A pedestrian narrowly avoided falling in yesterday evening.',
    location: 'Near Bandra Station, West side',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 5,
    severity: 'Critical',
    severityScore: 95,
    status: 'In Progress',
    confidence: 93,
    support: 18,
    reportCount: 9,
    communitySignal: true,
    signalStrength: 'moderate',
    signal: 'drainage',
    lat: 19.0543,
    lng: 72.8418,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00160',
    title: 'Illegal construction debris on footpath',
    category: 'Pollution',
    description:
      'Large piles of construction debris have been dumped illegally on the footpath near BKC, blocking pedestrian movement and spreading dust across the area.',
    location: 'Near Bandra Kurla Complex',
    area: 'Bandra East',
    city: 'Mumbai',
    daysAgo: 8,
    severity: 'Medium',
    severityScore: 58,
    status: 'Resolved',
    confidence: 89,
    support: 12,
    reportCount: 7,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'pollution',
    lat: 19.0683,
    lng: 72.8666,
    verified: 'partial',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00155',
    title: 'Garbage heap near Carter Road promenade',
    category: 'Sanitation',
    description:
      'A recurring garbage heap forms near the Carter Road promenade every weekend, attracting stray dogs and affecting the walkway used by many residents.',
    location: 'Carter Road promenade',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 3,
    severity: 'Medium',
    severityScore: 66,
    status: 'In Progress',
    confidence: 92,
    support: 31,
    reportCount: 18,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'garbage',
    lat: 19.0458,
    lng: 72.8218,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00150',
    title: 'Broken traffic signal at S.V. Road crossing',
    category: 'Traffic Signal',
    description:
      'The traffic signal at the S.V. Road – Linking Road crossing is malfunctioning, flashing amber in all directions. Vehicles queue dangerously during peak hours.',
    location: 'S.V. Road crossing, Bandra',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 3,
    severity: 'High',
    severityScore: 81,
    status: 'Reported',
    confidence: 90,
    support: 9,
    reportCount: 4,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'traffic',
    lat: 19.0608,
    lng: 72.8391,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00148',
    title: 'Waterlogging after light rain on Hill Road',
    category: 'Drainage',
    description:
      'Choked storm drains near Hill Road cause waterlogging even after light rain, making the road impassable for two-wheelers and affecting ground-floor shops.',
    location: 'Hill Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 1,
    severity: 'High',
    severityScore: 78,
    status: 'Reported',
    confidence: 88,
    support: 7,
    reportCount: 3,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'drainage',
    lat: 19.0643,
    lng: 72.8289,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00141',
    title: 'Burned-out streetlight near Pali Hill market',
    category: 'Street Lighting',
    description:
      'A streetlight near Pali Hill market has been non-functional for two weeks, leaving the approach lane dark at night.',
    location: 'Pali Hill, near market',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 9,
    severity: 'Medium',
    severityScore: 55,
    status: 'In Progress',
    confidence: 86,
    support: 6,
    reportCount: 2,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'streetlight',
    lat: 19.0681,
    lng: 72.8261,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00136',
    title: 'Pothole on Waterfield Road',
    category: 'Roads & Infrastructure',
    description:
      'A pothole on Waterfield Road near the Bandra station end is causing vehicles to swerve dangerously. Needs urgent patching.',
    location: 'Waterfield Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 6,
    severity: 'Medium',
    severityScore: 61,
    status: 'AI Verified',
    confidence: 90,
    support: 15,
    reportCount: 8,
    communitySignal: true,
    signalStrength: 'growing',
    signal: 'pothole',
    lat: 19.0565,
    lng: 72.8399,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00132',
    title: 'Construction waste dumped near Khar Danda',
    category: 'Sanitation',
    description:
      'Construction debris dumped illegally on the Khar Danda approach road is blocking pedestrian movement and spreading dust.',
    location: 'Khar Danda, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 7,
    severity: 'Medium',
    severityScore: 59,
    status: 'In Progress',
    confidence: 89,
    support: 13,
    reportCount: 6,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'garbage',
    lat: 19.0689,
    lng: 72.8301,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00128',
    title: 'Resolved: Pothole filled on Linking Road',
    category: 'Roads & Infrastructure',
    description:
      'A pothole near the Linking Road–Hill Road junction was repaired by the municipal team after multiple reports from residents.',
    location: 'Linking Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 10,
    severity: 'Medium',
    severityScore: 62,
    status: 'Resolved',
    confidence: 94,
    support: 38,
    reportCount: 21,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'pothole',
    lat: 19.0588,
    lng: 72.8397,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00122',
    title: 'Dustbin overflowing at Bandra station exit',
    category: 'Sanitation',
    description:
      'The public dustbin near the Bandra station exit has been overflowing for days, with waste spilling onto the pavement.',
    location: 'Bandra Station, East exit',
    area: 'Bandra East',
    city: 'Mumbai',
    daysAgo: 4,
    severity: 'High',
    severityScore: 76,
    status: 'In Progress',
    confidence: 91,
    support: 22,
    reportCount: 10,
    communitySignal: true,
    signalStrength: 'growing',
    signal: 'garbage',
    lat: 19.0545,
    lng: 72.8421,
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00117',
    title: 'Streetlight cluster dark on Khar West stretch',
    category: 'Street Lighting',
    description:
      'A cluster of streetlights near Khar West is not working, leaving the service road completely dark at night.',
    location: 'Khar West, near M.R. school',
    area: 'Khar West',
    city: 'Mumbai',
    daysAgo: 8,
    severity: 'Medium',
    severityScore: 60,
    status: 'Resolved',
    confidence: 90,
    support: 9,
    reportCount: 5,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'streetlight',
    lat: 19.0714,
    lng: 72.8332,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00112',
    title: 'Garbage accumulation outside municipal school',
    category: 'Sanitation',
    description:
      'Large quantities of uncollected waste have accumulated near the school entrance in Khar West for over four days, creating health concerns for students.',
    location: 'Khar West, near M.R. Municipal School',
    area: 'Khar West',
    city: 'Mumbai',
    daysAgo: 5,
    severity: 'High',
    severityScore: 88,
    status: 'Resolved',
    confidence: 96,
    support: 25,
    reportCount: 13,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'garbage',
    lat: 19.0714,
    lng: 72.8332,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00108',
    title: 'Deep pothole causing repeated tyre damage',
    category: 'Roads & Infrastructure',
    description:
      'A wide pothole near the Matunga market crossing has damaged at least four two-wheelers in the last week. It fills with rainwater and is invisible at night.',
    location: 'Matunga Market Crossing',
    area: 'Matunga',
    city: 'Mumbai',
    daysAgo: 12,
    severity: 'High',
    severityScore: 82,
    status: 'Resolved',
    confidence: 94,
    support: 31,
    reportCount: 17,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'pothole',
    lat: 19.0225,
    lng: 72.8522,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00103',
    title: 'Continuous water leakage flooding lane',
    category: 'Water Supply',
    description:
      'A major water pipeline leak in Mankhurd has been flooding the lane for two days, wasting treated water and creating hazardous surfaces.',
    location: 'Dr. Ambedkar Nagar, Mankhurd',
    area: 'Mankhurd',
    city: 'Mumbai',
    daysAgo: 9,
    severity: 'Critical',
    severityScore: 93,
    status: 'Resolved',
    confidence: 97,
    support: 41,
    reportCount: 26,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'water',
    lat: 19.0455,
    lng: 72.9291,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00099',
    title: 'Open manhole with no safety guard',
    category: 'Drainage',
    description:
      'An uncovered manhole near the Lokmanya Tilak terminus footpath in Kurla has no warning sign or guard.',
    location: 'Lokmanya Tilak Terminus, Kurla',
    area: 'Kurla',
    city: 'Mumbai',
    daysAgo: 10,
    severity: 'Critical',
    severityScore: 95,
    status: 'Resolved',
    confidence: 93,
    support: 18,
    reportCount: 9,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'drainage',
    lat: 19.075,
    lng: 72.885,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00095',
    title: 'Streetlight not working on Linking Road stretch',
    category: 'Street Lighting',
    description:
      'Three consecutive streetlights are dark on Linking Road near the Bandra west junction. The stretch feels unsafe after 8 PM.',
    location: 'Linking Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 11,
    severity: 'Medium',
    severityScore: 62,
    status: 'Resolved',
    confidence: 91,
    support: 8,
    reportCount: 5,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'streetlight',
    lat: 19.0579,
    lng: 72.8402,
    verified: 'yes',
  }),
  mk({
    id: 'CS-MUM-BAN-2026-00090',
    title: 'Your report: Stray waste pile near my society',
    category: 'Sanitation',
    description:
      'A pile of stray waste has formed near the entrance of my society in Bandra West. It has not been collected for three days and is attracting strays.',
    location: 'Off Waterfield Road, Bandra West',
    area: 'Bandra West',
    city: 'Mumbai',
    daysAgo: 3,
    severity: 'High',
    severityScore: 79,
    status: 'In Progress',
    confidence: 93,
    support: 6,
    reportCount: 2,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'garbage',
    lat: 19.0563,
    lng: 72.8392,
    reporter: 'You',
    isMine: true,
  }),
  mk({
    id: 'CS-MUM-AND-2026-00201',
    title: 'Garbage pile near Marol Naka market',
    category: 'Sanitation',
    description:
      'Uncollected garbage has piled up near the Marol Naka market entrance for over three days, creating a strong odour and attracting strays.',
    location: 'Marol Naka, Andheri East',
    area: 'Andheri East',
    city: 'Mumbai',
    daysAgo: 3,
    severity: 'High',
    severityScore: 82,
    status: 'In Progress',
    confidence: 94,
    support: 17,
    reportCount: 9,
    communitySignal: true,
    signalStrength: 'growing',
    signal: 'garbage',
    lat: 19.1122,
    lng: 72.8758,
  }),
  mk({
    id: 'CS-MUM-AND-2026-00202',
    title: 'Deep pothole near Lokhandwala Complex',
    category: 'Roads & Infrastructure',
    description:
      'A wide pothole on the approach road to Lokhandwala Complex has damaged two two-wheelers this week and fills with water when it rains.',
    location: 'Lokhandwala Complex, Andheri West',
    area: 'Andheri West',
    city: 'Mumbai',
    daysAgo: 5,
    severity: 'High',
    severityScore: 84,
    status: 'Assigned',
    confidence: 93,
    support: 22,
    reportCount: 11,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'pothole',
    lat: 19.1203,
    lng: 72.8398,
  }),
  mk({
    id: 'CS-MUM-POW-2026-00203',
    title: 'Streetlight cluster dark near Hiranandani',
    category: 'Street Lighting',
    description:
      'A stretch of streetlights near Hiranandani Gardens gate is not working, leaving the road completely dark after 9 PM for pedestrians and cyclists.',
    location: 'Hiranandani Gardens, Powai',
    area: 'Powai',
    city: 'Mumbai',
    daysAgo: 6,
    severity: 'Medium',
    severityScore: 63,
    status: 'Reported',
    confidence: 90,
    support: 12,
    reportCount: 6,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'streetlight',
    lat: 19.1163,
    lng: 72.9095,
  }),
  mk({
    id: 'CS-MUM-WOR-2026-00204',
    title: 'Choked storm drain near Worli seaface',
    category: 'Drainage',
    description:
      'Storm drain near the Worli seaface road is choked with waste, causing waterlogging on the service lane after moderate rain.',
    location: 'Worli Seaface',
    area: 'Worli',
    city: 'Mumbai',
    daysAgo: 2,
    severity: 'High',
    severityScore: 80,
    status: 'AI Verified',
    confidence: 92,
    support: 19,
    reportCount: 10,
    communitySignal: true,
    signalStrength: 'growing',
    signal: 'drainage',
    lat: 19.011,
    lng: 72.816,
  }),
  mk({
    id: 'CS-MUM-DAD-2026-00205',
    title: 'Traffic signal malfunction at Plaza crossing',
    category: 'Traffic Signal',
    description:
      'The traffic signal at Dadar Plaza crossing is stuck on amber, causing long queues and near-misses during peak hours.',
    location: 'Plaza Crossing, Dadar West',
    area: 'Dadar West',
    city: 'Mumbai',
    daysAgo: 4,
    severity: 'High',
    severityScore: 79,
    status: 'Reported',
    confidence: 89,
    support: 14,
    reportCount: 7,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'traffic',
    lat: 19.0175,
    lng: 72.8471,
  }),
  mk({
    id: 'CS-MUM-GHA-2026-00206',
    title: 'Water leakage near Ghatkopar station',
    category: 'Water Supply',
    description:
      'Continuous water seepage from a pipeline near Ghatkopar station is wasting treated water and making the footpath slippery.',
    location: 'Ghatkopar Station, West',
    area: 'Ghatkopar West',
    city: 'Mumbai',
    daysAgo: 3,
    severity: 'High',
    severityScore: 81,
    status: 'In Progress',
    confidence: 95,
    support: 26,
    reportCount: 13,
    communitySignal: true,
    signalStrength: 'strong',
    signal: 'water',
    lat: 19.0865,
    lng: 72.9074,
  }),
  mk({
    id: 'CS-MUM-VIL-2026-00207',
    title: 'Dustbin overflow near Vile Parle station exit',
    category: 'Sanitation',
    description:
      'Public dustbins near the Vile Parle station east exit are overflowing with waste spilling onto the pavement.',
    location: 'Vile Parle Station, East exit',
    area: 'Vile Parle West',
    city: 'Mumbai',
    daysAgo: 5,
    severity: 'Medium',
    severityScore: 65,
    status: 'In Progress',
    confidence: 91,
    support: 10,
    reportCount: 5,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'garbage',
    lat: 19.0996,
    lng: 72.8465,
  }),
  mk({
    id: 'CS-MUM-COL-2026-00208',
    title: 'Pothole near Gateway of India approach',
    category: 'Roads & Infrastructure',
    description:
      'A pothole on the approach road to the Gateway of India has been patched and reopened multiple times, damaging tourist taxis.',
    location: 'Gateway Approach, Colaba',
    area: 'Colaba',
    city: 'Mumbai',
    daysAgo: 8,
    severity: 'Medium',
    severityScore: 60,
    status: 'Resolved',
    confidence: 88,
    support: 16,
    reportCount: 9,
    communitySignal: false,
    signalStrength: 'moderate',
    signal: 'pothole',
    lat: 18.9219,
    lng: 72.8346,
    verified: 'partial',
  }),
]

export const FEED_SEED_IDS = INITIAL_COMPLAINTS.map((c) => c.id)

export const CIVIC_AREAS: CivicArea[] = [
  { id: 'bandra-w', name: 'Bandra West', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295, landmark: 'Linking Road', zones: ['Linking Road', 'Hill Road', 'Pali Hill', 'Carter Road', 'Waterfield Road', 'Bandra Station'] },
  { id: 'bandra-e', name: 'Bandra East', city: 'Mumbai', pincode: '400051', lat: 19.0596, lng: 72.8434, landmark: 'Bandra Station East', zones: ['Bandra Station East', 'Bandra Kurla Complex', 'Kala Nagar'] },
  { id: 'khar-w', name: 'Khar West', city: 'Mumbai', pincode: '400052', lat: 19.0714, lng: 72.8332, landmark: 'Khar Station', zones: ['Khar Station', 'Khar Danda', 'Linking Road'] },
  { id: 'matunga', name: 'Matunga', city: 'Mumbai', pincode: '400019', lat: 19.0225, lng: 72.8522, landmark: 'Matunga Market', zones: ['Matunga Market', 'Matunga Station'] },
  { id: 'kurla', name: 'Kurla', city: 'Mumbai', pincode: '400070', lat: 19.075, lng: 72.885, landmark: 'LTT Terminus', zones: ['LTT Terminus', 'Kurla Station'] },
  { id: 'mankhurd', name: 'Mankhurd', city: 'Mumbai', pincode: '400043', lat: 19.0455, lng: 72.9291, landmark: 'Mankhurd Station', zones: ['Ambedkar Nagar'] },
  { id: 'andheri-e', name: 'Andheri East', city: 'Mumbai', pincode: '400069', lat: 19.1136, lng: 72.8697, landmark: 'Andheri Flyover', zones: ['Andheri Flyover', 'Marol'] },
  { id: 'dadar', name: 'Dadar', city: 'Mumbai', pincode: '400014', lat: 19.0175, lng: 72.8471, landmark: 'Dadar TT', zones: ['Dadar TT', 'Shivaji Park'] },
  { id: 'ghatkopar', name: 'Ghatkopar', city: 'Mumbai', pincode: '400086', lat: 19.0865, lng: 72.9074, landmark: 'Ghatkopar Station', zones: ['Service Road'] },
  { id: 'chembur', name: 'Chembur', city: 'Mumbai', pincode: '400071', lat: 19.0448, lng: 72.8955, landmark: 'Chembur Naka', zones: ['Chembur Naka'] },
]

export const CIVIC_INSIGHTS: CivicInsight[] = [
  {
    id: 'ins-1',
    title: 'Garbage spike near market zones',
    body: 'Garbage-related complaints in Bandra have increased 18% this week, mainly concentrated around market areas and the station exit.',
    recommendation: 'Increase sanitation inspection frequency near market zones and public bins.',
    tone: 'warn',
    metric: '18%',
    delta: 18,
  },
  {
    id: 'ins-2',
    title: 'Streetlight faults cluster at 3 spots',
    body: 'Streetlight complaints are concentrated around Hill Road, Pali Hill market and the Linking Road junction.',
    recommendation: 'Prioritise lamp maintenance across these three stretches before nightfall.',
    tone: 'info',
    metric: '3',
    delta: 0,
  },
  {
    id: 'ins-3',
    title: 'Resolution efficiency improving',
    body: 'Average resolution time in Bandra improved 14% this month, driven by faster sanitation turnarounds.',
    recommendation: 'Sustained ward responsiveness is working — keep the momentum.',
    tone: 'good',
    metric: '14%',
    delta: 14,
  },
]

export const CIVIC_ALERTS: CivicAlert[] = [
  {
    id: 'al-1',
    kind: 'priority',
    title: 'HIGH PRIORITY',
    message: 'Heavy water leakage reported near Bandra West. 7 citizens have reported the same issue.',
    time: '2 hrs ago',
    complaintId: 'CS-MUM-BAN-2026-00171',
  },
  {
    id: 'al-2',
    kind: 'resolved',
    title: 'RESOLVED',
    message: 'The pothole reported on Linking Road has been marked resolved and verified by the community.',
    time: '5 hrs ago',
    complaintId: 'CS-MUM-BAN-2026-00128',
  },
  {
    id: 'al-3',
    kind: 'community',
    title: 'COMMUNITY',
    message: '15 citizens have joined a sanitation complaint near Bandra Market.',
    time: '9 hrs ago',
    complaintId: 'CS-MUM-BAN-2026-00182',
  },
  {
    id: 'al-4',
    kind: 'priority',
    title: 'SAFETY',
    message: 'Open manhole reported near Bandra Station — flagged for immediate barricading.',
    time: '1 day ago',
    complaintId: 'CS-MUM-BAN-2026-00167',
  },
]

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    kind: 'status',
    title: 'Complaint status updated',
    message: 'CS-MUM-BAN-2026-00182 is now In Progress. Sanitation crew assigned.',
    time: '2 hrs ago',
    read: false,
    complaintId: 'CS-MUM-BAN-2026-00182',
    view: 'overview',
  },
  {
    id: 'n-2',
    kind: 'authority',
    title: 'Authority responded',
    message: 'Ward Officer completed inspection for the pothole on Linking Road.',
    time: '5 hrs ago',
    read: false,
    complaintId: 'CS-MUM-BAN-2026-00179',
    view: 'overview',
  },
  {
    id: 'n-3',
    kind: 'community',
    title: 'Community joined your complaint',
    message: '6 more citizens supported your waste pile report.',
    time: '8 hrs ago',
    read: false,
    complaintId: 'CS-MUM-BAN-2026-00090',
    view: 'myreports',
  },
  {
    id: 'n-4',
    kind: 'resolved',
    title: 'Issue resolved',
    message: 'The pothole on Linking Road has been marked resolved.',
    time: '1 day ago',
    read: true,
    complaintId: 'CS-MUM-BAN-2026-00128',
    view: 'overview',
  },
  {
    id: 'n-5',
    kind: 'nearby',
    title: 'New issue nearby',
    message: 'A broken traffic signal was reported at the S.V. Road crossing, 450 m from you.',
    time: '1 day ago',
    read: true,
    complaintId: 'CS-MUM-BAN-2026-00150',
    view: 'nearby',
  },
  {
    id: 'n-6',
    kind: 'ai',
    title: 'AI Insight',
    message: 'Garbage complaints in Bandra rose 18% this week around market zones.',
    time: '2 days ago',
    read: true,
    view: 'overview',
  },
]

export const AUTHORITY_ACTIVITY: AuthorityActionFeed[] = [
  {
    id: 'act-1',
    actor: 'Ward Officer',
    role: 'Bandra West Ward Office',
    action: 'Inspection completed for the open manhole near Bandra Station. Barricading ordered.',
    time: '40 min ago',
    kind: 'inspection',
    area: 'Bandra West',
  },
  {
    id: 'act-2',
    actor: 'Sanitation Team',
    role: 'Municipal Sanitation Department',
    action: 'Cleaning crew assigned to the garbage heap at Bandra Market.',
    time: '1 hr ago',
    kind: 'crew',
    area: 'Bandra West',
  },
  {
    id: 'act-3',
    actor: 'Field Engineer',
    role: 'Water Supply & Sewerage Department',
    action: 'Leakage point located near Bandra Reclamation. Valve closure scheduled.',
    time: '3 hrs ago',
    kind: 'response',
    area: 'Bandra West',
  },
  {
    id: 'act-4',
    actor: 'Municipal Team',
    role: 'Roads & Infrastructure Department',
    action: 'Patching crew dispatched to the Linking Road pothole.',
    time: '6 hrs ago',
    kind: 'repair',
    area: 'Bandra West',
  },
]

export const ASSISTANT_CANNED: Record<
  string,
  { title: string; answer: string }
> = {
  status: {
    title: 'Track my complaint',
    answer:
      'You can check the live status of any complaint from the Live Tracker. Each complaint moves through a clear pipeline: Reported → AI Verified → Assigned → In Progress → Resolved. When the status changes, you will see it update instantly on your complaint card.',
  },
  explain: {
    title: 'Explain a government response',
    answer:
      'Government responses can be formal. When you open a resolved complaint, tap "Explain Simply" on the AI Response Translator and I will translate the official text into clear, everyday language — including who is responsible and what happens next.',
  },
  water: {
    title: 'How to report a water leak',
    answer:
      'Go to the AI Reporter and describe the leak in your own words, or use the microphone and speak. Add a photo or video if you can. I will verify the details, mark the severity, and route the complaint directly to the Water Supply & Sewerage Department — usually within a minute.',
  },
  garbage: {
    title: 'Which department handles garbage?',
    answer:
      'Garbage and sanitation issues are handled by the Municipal Sanitation Department. If waste has been lying uncollected for days, the complaint gets a higher priority automatically, especially near schools, hospitals or markets.',
  },
  status_meaning: {
    title: 'What does my status mean?',
    answer:
      'Here is what each stage means: "AI Verified" means I checked your report and it is legitimate. "Assigned" means a department officer now owns it. "In Progress" means field staff are acting on it. "Resolved" means the department says the issue is fixed — and you can verify whether it really is.',
  },
  evidence: {
    title: 'Add new evidence',
    answer:
      'If an issue is still unresolved, open the complaint and choose "No — Upload New Evidence". Attach a fresh photo or video, and I will escalate the complaint back to the department automatically.',
  },
  priority: {
    title: 'How is priority decided?',
    answer:
      'I combine three things: the type of issue, its location sensitivity (like schools or hospitals), and how long it has persisted. Risk to public safety pushes the severity score higher, so the right department responds faster.',
  },
  languages: {
    title: 'Which languages do you support?',
    answer:
      'Civic Saathi currently works in English, Hindi and Marathi. Use the language selector in the sidebar to switch instantly. More languages are on the way.',
  },
  verify: {
    title: 'How do I verify a resolution?',
    answer:
      'When a complaint is marked Resolved, you can confirm it. Tap "Yes — Verified" if the problem is genuinely fixed, "Partially Fixed" if it is improved, or "No — Upload New Evidence" to reopen it with fresh proof.',
  },
  near_me: {
    title: 'What problems are near me?',
    answer: 'PLACEHOLDER_NEAR_ME',
  },
  department: {
    title: 'Which department handles X?',
    answer:
      'Most civic issues map to a clear department: garbage → Municipal Sanitation Department, potholes & roads → Roads & Infrastructure Department, streetlights → Electrical Maintenance Department, water leaks → Water Supply & Sewerage Department, drainage → Drainage & Stormwater Department, and traffic signals → Traffic Engineering Department.',
  },
  health: {
    title: 'How is my area doing?',
    answer:
      'Your area health is computed from active issue load, resolution times and community participation. Open the dashboard to see your Civic Health Score, resolved counts and AI insights for the week.',
  },
}

export const SUGGESTED_QUESTIONS = [
  'What problems are near me?',
  'What happened to my complaint?',
  'Has the pothole near Linking Road been fixed?',
  'Which department handles water leakage?',
  'How is my area doing?',
]

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
]

export const AUTHORITY_ACTORS: Record<string, { name: string; role: string; icon: string }> = {
  'Ward Officer': { name: 'Ward Officer', role: 'Bandra West Ward Office', icon: '🏛' },
  'Sanitation Team': { name: 'Sanitation Team', role: 'Municipal Sanitation Department', icon: '🧹' },
  'Field Engineer': { name: 'Field Engineer', role: 'Water Supply & Sewerage', icon: '📸' },
  'Municipal Team': { name: 'Municipal Team', role: 'Roads & Infrastructure', icon: '🚧' },
}

export { fmt as formatTimestamp, iso as isoDaysAgo }
