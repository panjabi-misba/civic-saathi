import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Complaint } from '@/types/civic'
import { INITIAL_COMPLAINTS, FEED_SEED_IDS } from '@/data/mockData'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const REQUIRED_COMPLAINT_FIELDS: (keyof Complaint)[] = [
  'id',
  'title',
  'category',
  'description',
  'location',
  'area',
  'city',
  'date',
  'reportedAt',
  'severity',
  'status',
  'department',
  'confidence',
  'support',
  'reportCount',
  'communitySignal',
  'signalStrength',
  'signal',
  'lat',
  'lng',
  'timeline',
  'comments',
  'evidence',
  'authorityFeed',
]

function isComplaint(value: unknown): value is Complaint {
  if (value == null || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return REQUIRED_COMPLAINT_FIELDS.every((field) => item[field] != null)
}

function normalizeComplaints(value: unknown): Complaint[] {
  if (!Array.isArray(value)) return INITIAL_COMPLAINTS
  if (value.length === 0) return value
  return value.every(isComplaint) ? (value as Complaint[]) : INITIAL_COMPLAINTS
}

function normalizeSupported(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : []
}

function mergeSeeds(base: Complaint[]): Complaint[] {
  const byId = new Set(base.map((c) => c.id))
  const missing = FEED_SEED_IDS.filter((id) => !byId.has(id))
  if (missing.length === 0) return base
  const seedMap = new Map(INITIAL_COMPLAINTS.map((c) => [c.id, c]))
  const added = missing
    .map((id) => seedMap.get(id))
    .filter((c): c is Complaint => Boolean(c))
  return added.length > 0 ? [...base, ...added] : base
}

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    mergeSeeds(normalizeComplaints(loadFromStorage<unknown>('complaints', INITIAL_COMPLAINTS))),
  )
  const [supportedIds, setSupportedIds] = useState<string[]>(() =>
    normalizeSupported(loadFromStorage<unknown>('supported', [])),
  )

  useEffect(() => {
    saveToStorage('complaints', complaints)
  }, [complaints])

  useEffect(() => {
    saveToStorage('supported', supportedIds)
  }, [supportedIds])

  const addComplaint = useCallback((complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev])
  }, [])

  const updateComplaint = useCallback((id: string, patch: Partial<Complaint>) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
  }, [])

  const updateResolution = useCallback(
    (id: string, verified: 'yes' | 'partial' | 'no', citizenNote?: string) => {
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          const reopened = verified === 'no'
          const disputed = reopened
          return {
            ...c,
            status: reopened ? 'Citizen Disputed' : c.status,
            resolution: {
              officialResponse:
                c.resolution?.officialResponse ??
                'The concerned department has acknowledged the grievance.',
              aiExplanation:
                c.resolution?.aiExplanation ??
                'The department has acknowledged the complaint and is reviewing it.',
              verified,
              citizenNote: citizenNote ?? c.resolution?.citizenNote,
              disputed,
            },
          }
        }),
      )
    },
    [],
  )

  const addSupport = useCallback(
    (id: string) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, support: c.support + 1 } : c)),
      )
      setSupportedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [],
  )

  const isSupported = useCallback(
    (id: string) => supportedIds.includes(id),
    [supportedIds],
  )

  const joinComplaint = useCallback((id: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, reportCount: c.reportCount + 1, support: c.support + 1 }
          : c,
      ),
    )
    setSupportedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const addComment = useCallback((id: string, text: string, author: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              comments: [
                ...c.comments,
                {
                  id: `c-${Math.random().toString(36).slice(2)}`,
                  author,
                  text,
                  time: 'Just now',
                  safe: true,
                },
              ],
            }
          : c,
      ),
    )
  }, [])

  const addEvidence = useCallback((id: string, files: File[]) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              evidence: [
                ...c.evidence,
                ...files.map((f) => ({
                  id: `ev-${Math.random().toString(36).slice(2)}`,
                  name: f.name,
                  type: (f.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video',
                  uploadedAt: new Date().toISOString(),
                  by: 'You',
                })),
              ],
            }
          : c,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({
      complaints,
      supportedIds,
      addComplaint,
      updateComplaint,
      updateResolution,
      addSupport,
      isSupported,
      joinComplaint,
      addComment,
      addEvidence,
    }),
    [
      complaints,
      supportedIds,
      addComplaint,
      updateComplaint,
      updateResolution,
      addSupport,
      isSupported,
      joinComplaint,
      addComment,
      addEvidence,
    ],
  )

  return value
}
