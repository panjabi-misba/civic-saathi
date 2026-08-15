import type { CivicArea, Complaint, Language } from '@/types/civic'
import { ASSISTANT_CANNED } from '@/data/mockData'
import { haversineKm, formatDistance } from '@/utils/geo'

interface ReplyResult {
  text: string
  followUps: string[]
}

const FALLBACK_ANSWER =
  'I am here to help with anything civic. You can ask me to track a complaint, explain a government response, report a water leak, or check which department handles a problem. If you share a Complaint ID, I can look up its live status for you.'

const GREETINGS = [
  'Namaste! I am Civic Saathi, your AI civic assistant. I can track complaints, translate official responses, route issues to the right department, and much more. What would you like to do?',
  'Hello! How can I help you with your city today? I can track a complaint, explain a response, or guide you on reporting a new issue.',
]

const FOLLOW_UPS: Record<string, string[]> = {
  status: ['What does my status mean?', 'Which department handles garbage?', 'Explain the government response.'],
  explain: ['How do I verify a resolution?', 'What happened to my complaint?', 'How is priority decided?'],
  water: ['Which department handles garbage?', 'What does my status mean?', 'How is priority decided?'],
  garbage: ['What happened to my complaint?', 'Explain the government response.', 'Which languages do you support?'],
  status_meaning: ['How do I verify a resolution?', 'What happened to my complaint?', 'How is priority decided?'],
  evidence: ['What happened to my complaint?', 'How do I verify a resolution?', 'Explain the government response.'],
  priority: ['What happened to my complaint?', 'Which department handles garbage?', 'Explain the government response.'],
  languages: ['What happened to my complaint?', 'Explain the government response.', 'Which department handles garbage?'],
  verify: ['Explain the government response.', 'What happened to my complaint?', 'How is priority decided?'],
  complaint: ['What does my status mean?', 'Explain the government response.', 'How is priority decided?'],
  near_me: ['What happened to my complaint?', 'How is my area doing?', 'Which department handles garbage?'],
  department: ['What happened to my complaint?', 'What problems are near me?', 'How is my area doing?'],
  health: ['What problems are near me?', 'What happened to my complaint?', 'Which department handles garbage?'],
  fallback: ['Track my complaint', 'Explain the government response.', 'How do I report a water leak?'],
}

function route(question: string): string | null {
  const q = question.toLowerCase()
  const has = (...words: string[]) => words.some((w) => q.includes(w))

  if (has('hello', 'hi ', 'namaste', 'hey', 'start', 'help me', 'what can you do')) return 'greeting'
  if (has('near me', 'around me', 'nearby', 'near my', 'my area', 'happening around', 'problems near')) return 'near_me'
  if (has('area doing', 'area health', 'civic health', 'score', 'my area?', 'health of')) return 'health'
  if (has('department', 'handles', 'which dept', 'who handles', 'responsible for')) return 'department'
  if (has('track', 'my complaint', 'happened to', 'happening', 'update', 'progress', 'where is', 'fixed', 'resolved')) return 'status'
  if (has('explain', 'simple language', 'translate', 'government response', 'official', 'understand', 'plain')) return 'explain'
  if (has('water leak', 'pipe', 'leaking', 'pipeline')) return 'water'
  if (has('garbage', 'waste', 'trash', 'kabada', 'kacra', 'kuchra', 'sanitation', 'smell', 'stink')) return 'garbage'
  if (has('meaning', 'what does', 'stage', 'pipeline', 'steps', 'stages', 'process')) return 'status_meaning'
  if (has('evidence', 'photo', 'video', 'proof', 'upload', 'reopen')) return 'evidence'
  if (has('priority', 'prioriti', 'urgent', 'severe', 'serious', 'fast', 'quickly')) return 'priority'
  if (has('language', 'hindi', 'marathi', 'bhasha', 'translate app', 'multilingual')) return 'languages'
  if (has('verify', 'verification', 'actually')) return 'verify'
  return null
}

export function getAssistantReply(
  question: string,
  complaints?: Complaint[],
  language?: Language,
  area?: CivicArea | null,
): ReplyResult {
  const trimmed = question.trim()
  const idMatch = trimmed.toUpperCase().match(/CS-MUM-\d{5}/)

  if (idMatch && complaints) {
    const complaint = complaints.find((c) => c.id === idMatch[0])
    if (complaint) {
      const dept = complaint.department || 'the concerned department'
      const text =
        `I found **${complaint.id}** — “${complaint.title}”. ` +
        `It is currently **${complaint.status}** (${complaint.progress}% complete) and routed to ${dept}. ` +
        (complaint.resolution?.officialResponse
          ? `The latest official note says: “${complaint.resolution.officialResponse}”. `
          : '') +
        `${complaint.support} neighbours support this report.`
      return { text, followUps: FOLLOW_UPS.complaint }
    }
    return {
      text: `I could not find a complaint with the ID **${idMatch[0]}** in our records. Double-check the ID, or ask me to list recent complaints instead.`,
      followUps: FOLLOW_UPS.status,
    }
  }

  if (area && complaints && complaints.length > 0) {
    const active = complaints.filter(
      (c) => c.status !== 'Resolved' && c.area === area.name,
    )
    if (active.length > 0) {
      const nearest = active
        .map((c) => ({
          c,
          d: haversineKm(area.lat, area.lng, c.lat, c.lng),
        }))
        .sort((a, b) => a.d - b.d)[0]
      const totalSupport = active.reduce((s, c) => s + c.support, 0)
      const top = [...active]
        .sort((a, b) => b.support - a.support)
        .slice(0, 3)
        .map((c) => `• ${c.title} (${c.status}, ${c.support} supporters)`)
        .join('\n')
      return {
        text:
          `There are **${active.length} active civic issues** in **${area.name}, ${area.city}**. ` +
          `The nearest is **${nearest.c.title}** about ${formatDistance(nearest.d)} away — currently ${nearest.c.status} with ${nearest.c.support} neighbours supporting. ${totalSupport} community signals in total.\n\nTop issues:\n${top}`,
        followUps: FOLLOW_UPS.near_me,
      }
    }
  }

  const r = route(trimmed)
  if (r === 'greeting') {
    const text = language === 'hi' ? GREETINGS[1] : GREETINGS[0]
    return { text, followUps: FOLLOW_UPS.fallback }
  }
  if (r === 'near_me') {
    const text = area
      ? `There are no active issues currently listed for **${area.name}** in our demo feed. Try “How is my area doing?” or ask about a specific complaint.`
      : 'Pick a civic area first so I can tell you what is happening nearby.'
    return { text, followUps: FOLLOW_UPS.near_me }
  }
  if (r === 'status' && complaints) {
    const mine = complaints.filter((c) => c.isMine)
    if (mine.length > 0) {
      const latest = mine[0]
      const text =
        `Your most recent report **${latest.id}** — “${latest.title}” — is currently **${latest.status}** at ${latest.progress}% progress. ${latest.expectedAction ? `Expected next action: ${latest.expectedAction}.` : ''} You have ${mine.length} active report${mine.length > 1 ? 's' : ''} in total.`
      return { text, followUps: FOLLOW_UPS.status }
    }
  }
  if (r && ASSISTANT_CANNED[r]) {
    if (r === 'near_me') return { text: ASSISTANT_CANNED.near_me.answer, followUps: FOLLOW_UPS.near_me }
    return { text: ASSISTANT_CANNED[r].answer, followUps: FOLLOW_UPS[r] }
  }

  return { text: FALLBACK_ANSWER, followUps: FOLLOW_UPS.fallback }
}
