import { jsPDF } from 'jspdf'
import type { Complaint } from '@/types/civic'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 56
const CONTENT_W = PAGE_W - MARGIN * 2

const INK = '#0f172a'
const MUTED = '#64748b'
const LINE = '#e2e8f0'
const GREEN = '#059669'
const ACCENT = '#0f172a'

type Doc = jsPDF

interface Block {
  title: string
  lines: string[]
}

function footer(doc: Doc) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    doc.text('Civic Saathi · AI-Generated Civic Report', MARGIN, PAGE_H - 24)
    doc.text(
      `Page ${i} of ${pageCount}`,
      PAGE_W - MARGIN,
      PAGE_H - 24,
      { align: 'right' },
    )
    doc.setDrawColor(LINE)
    doc.line(MARGIN, PAGE_H - 32, PAGE_W - MARGIN, PAGE_H - 32)
  }
}

function wrap(doc: Doc, text: string, width = CONTENT_W): string[] {
  return doc.splitTextToSize(text, width) as string[]
}

export function exportComplaintPdf(
  complaint: Complaint,
  options?: { citizenName?: string },
): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const citizen = options?.citizenName && !complaint.isMine
    ? options.citizenName
    : complaint.reporter || 'Anonymous Citizen'

  let y = MARGIN

  const ensure = (need: number) => {
    if (y + need > PAGE_H - 56) {
      doc.addPage()
      y = MARGIN
    }
  }

  const sectionTitle = (text: string, first = false) => {
    if (!first) ensure(44)
    y += first ? 0 : 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(GREEN)
    doc.text(text.toUpperCase(), MARGIN, y)
    y += 4
    doc.setDrawColor(GREEN)
    doc.setLineWidth(0.75)
    doc.line(MARGIN, y, MARGIN + 34, y)
    y += 14
  }

  const kv = (label: string, value: string) => {
    ensure(16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(MUTED)
    doc.text(label.toUpperCase(), MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(INK)
    const lines = wrap(doc, value, CONTENT_W * 0.62)
    doc.text(lines, MARGIN + CONTENT_W * 0.38, y, { lineHeightFactor: 1.35 })
    y += Math.max(14, lines.length * 12 + 2)
  }

  const paragraph = (text: string, opts?: { italic?: boolean; width?: number }) => {
    const lines = wrap(doc, text, opts?.width ?? CONTENT_W)
    ensure(lines.length * 13 + 6)
    doc.setFont('helvetica', opts?.italic ? 'italic' : 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(INK)
    doc.text(lines, MARGIN, y, { lineHeightFactor: 1.45 })
    y += lines.length * 13 + 8
  }

  const block = (b: Block) => {
    sectionTitle(b.title)
    b.lines.forEach((l) => paragraph(l))
    y += 6
  }

  /* ---------------- Header ---------------- */
  doc.setFillColor(ACCENT)
  doc.rect(0, 0, PAGE_W, 92, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  doc.setTextColor('#ffffff')
  doc.text('CIVIC SAATHI', MARGIN, 44)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#6ee7b7')
  doc.text('AI-GENERATED CIVIC REPORT', MARGIN, 62)
  doc.setTextColor('#94a3b8')
  doc.text('Civic Intelligence & Action Platform', MARGIN, 76)
  doc.setFontSize(10)
  doc.setTextColor('#ffffff')
  doc.text(complaint.id, PAGE_W - MARGIN, 46, { align: 'right' })
  doc.setFontSize(8.5)
  doc.setTextColor('#94a3b8')
  const generated = new Date(complaint.reportedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Generated: ${generated}`, PAGE_W - MARGIN, 62, { align: 'right' })
  doc.text('Status: Official Reference Document', PAGE_W - MARGIN, 76, { align: 'right' })

  y = 116

  /* ---------------- 1. Report summary ---------------- */
  sectionTitle('1. Complaint Summary', true)
  kv('Complaint ID', complaint.id)
  kv('Issue', complaint.title)
  kv('Category', complaint.category)
  kv('Severity', `${complaint.severity} (${complaint.severityScore}/100)`)
  kv('AI Confidence', `${complaint.confidence}%`)
  kv('Reporter', complaint.isMine ? 'You (registered citizen)' : citizen)
  kv('Location', `${complaint.location}, ${complaint.area}, ${complaint.city}`)
  kv('Responsible Department', complaint.department)
  kv(
    'Community Signal',
    `${complaint.support} citizens supporting · ${complaint.reportCount} similar reports nearby`,
  )
  kv('Current Status', `${complaint.status} · ${complaint.progress}% complete`)
  y += 10

  /* ---------------- 2. Issue description ---------------- */
  block({
    title: '2. Issue Description',
    lines: [complaint.description],
  })

  /* ---------------- 3. AI Reasoning ---------------- */
  const reasoning = complaint.resolution?.aiExplanation
    ? `${complaint.resolution.aiExplanation} Civic Saathi classified this report with ${complaint.confidence}% confidence, flagged ${complaint.signalStrength} community signal and routed it to ${complaint.department}.`
    : `Civic Saathi classified this report as a ${complaint.category.toLowerCase()} complaint with ${complaint.confidence}% confidence and routed it to ${complaint.department}.`
  block({
    title: '3. AI Reasoning',
    lines: [reasoning],
  })

  /* ---------------- 3b. Attached evidence (privacy-protected) ---------------- */
  const evImgs = complaint.aiAnalysis?.evidenceImages ?? []
  if (evImgs.some((i) => i.type === 'image' && (i.privacyUrl ?? i.thumbUrl))) {
    sectionTitle('3b. Attached Evidence')
    const images = evImgs.filter((i) => i.type === 'image' && (i.privacyUrl ?? i.thumbUrl))
    const perRow = Math.max(1, Math.floor(CONTENT_W / 88))
    const rows = Math.ceil(images.length / perRow)
    ensure(rows * 92 + 12)
    images.forEach((img, idx) => {
      const src = img.privacyUrl ?? img.thumbUrl
      if (!src) return
      const col = idx % perRow
      if (col === 0 && idx > 0) y += 92
      const ix = MARGIN + col * 88
      try {
        doc.addImage(src, 'JPEG', ix, y, 76, 76)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(MUTED)
        doc.text(img.name.slice(0, 26), ix, y + 84)
      } catch {
        /* skip un-embeddable image */
      }
    })
    y += rows * 92 + 8
  }

  /* ---------------- 4. Recommended action ---------------- */
  block({
    title: '4. Recommended Action',
    lines: [
      complaint.expectedAction
        ? `${complaint.expectedAction}. The department is expected to act on the priority set by the AI severity assessment.`
        : 'The department is expected to act on the priority set by the AI severity assessment.',
    ],
  })

  /* ---------------- 5. Generated formal complaint ---------------- */
  block({
    title: '5. Formal Complaint Text',
    lines: [complaint.description],
  })

  /* ---------------- 6. Resolution & official response ---------------- */
  if (complaint.resolution) {
    const statusLines = [
      `Official response: ${complaint.resolution.officialResponse}`,
    ]
    if (complaint.resolution.verified === 'yes') statusLines.push('Citizen verification: Confirmed fixed by the citizen.')
    else if (complaint.resolution.verified === 'partial') statusLines.push('Citizen verification: Partially fixed.')
    else if (complaint.resolution.disputed) statusLines.push('Citizen verification: Disputed — issue reopened with new evidence.')
    else statusLines.push('Citizen verification: Pending citizen confirmation.')
    block({
      title: '6. Resolution Status',
      lines: statusLines,
    })
  }

  /* ---------------- 7. Authority timeline ---------------- */
  if (complaint.authorityFeed.length > 0) {
    sectionTitle('7. Authority Activity')
    complaint.authorityFeed.forEach((a) => {
      ensure(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(INK)
      doc.text(`• ${a.actor} — ${a.role}`, MARGIN, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(MUTED)
      doc.text(a.time, PAGE_W - MARGIN, y, { align: 'right' })
      y += 11
      const lines = wrap(doc, a.action, CONTENT_W - 16)
      doc.setFontSize(9)
      doc.setTextColor('#334155')
      doc.text(lines, MARGIN + 16, y, { lineHeightFactor: 1.4 })
      y += lines.length * 11 + 10
    })
  }

  /* ---------------- 8. Full timeline ---------------- */
  sectionTitle('8. Complaint Timeline')
  complaint.timeline.forEach((entry) => {
    ensure(30)
    const when = new Date(entry.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(entry.kind === 'ai' ? GREEN : INK)
    doc.text(`• ${entry.label}`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(MUTED)
    doc.text(when, PAGE_W - MARGIN, y, { align: 'right' })
    y += 11
    const lines = wrap(doc, entry.description, CONTENT_W - 16)
    doc.setFontSize(9)
    doc.setTextColor('#334155')
    doc.text(lines, MARGIN + 16, y, { lineHeightFactor: 1.4 })
    y += lines.length * 11 + 8
  })

  /* ---------------- Footer legal ---------------- */
  ensure(60)
  y += 10
  doc.setDrawColor(LINE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  y += 14
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(
    wrap(
      doc,
      'This is an AI-assisted civic report generated by Civic Saathi for demonstration. Personal details are protected by the Civic Saathi Privacy Shield. Exact location is disclosed only to the responsible municipal authority.',
    ),
    MARGIN,
    y,
    { lineHeightFactor: 1.4 },
  )

  footer(doc)
  doc.save(`${complaint.id}.pdf`)
}
