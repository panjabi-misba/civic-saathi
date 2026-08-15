import { motion } from 'framer-motion'
import { Flame, ListFilter, MapPin, Navigation, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Complaint } from '@/types/civic'
import { CIVIC_AREAS, SIGNAL_META, SIGNAL_ORDER } from '@/data/mockData'
import { useLocation } from '@/hooks/useLocation'
import { useGeolocation } from '@/hooks/useGeolocation'
import { CivicFeed } from '@/components/dashboard/CivicFeed'
import { LocationPicker } from '@/components/location/LocationPicker'
import { ComplaintDetail } from '@/components/community/ComplaintDetail'
import { haversineKm, formatDistance } from '@/utils/geo'
import { cn } from '@/utils/cn'

interface CommunityProps {
  t: (key: string) => string
  complaints: Complaint[]
  isSupported: (id: string) => boolean
  onSupport: (id: string) => void
  onVerify: (id: string, verified: 'yes' | 'partial' | 'no') => void
  onAttachEvidence: (id: string) => void
  onAddComment: (id: string, text: string) => void
}

type SortMode = 'recent' | 'support' | 'severity'

export function Community({
  t,
  complaints,
  isSupported,
  onSupport,
  onVerify,
  onAttachEvidence,
  onAddComment,
}: CommunityProps) {
  const { location, radiusKm, recentLocations, changeLocation, setRadiusKm, clearRecent } = useLocation()
  const { locating, locate } = useGeolocation()
  const [signal, setSignal] = useState<string>('all')
  const [sort, setSort] = useState<SortMode>('recent')
  const [openId, setOpenId] = useState<string | null>(null)

  const withDistance = useMemo(() => {
    return complaints
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
      .map((c) => ({
        complaint: c,
        distanceKm: haversineKm(location.lat, location.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [complaints, location])

  const inRadius = useMemo(
    () => withDistance.filter((d) => d.distanceKm <= radiusKm),
    [withDistance, radiusKm],
  )

  const pool = inRadius.length > 0 ? inRadius : withDistance.slice(0, 6)
  const isFallback = inRadius.length === 0

  const stats = useMemo(() => {
    const active = pool.filter((d) => ['Reported', 'AI Verified', 'Assigned'].includes(d.complaint.status)).length
    const inProgress = pool.filter((d) => d.complaint.status === 'In Progress').length
    const resolved = pool.filter((d) => d.complaint.status === 'Resolved').length
    const highPriority = pool.filter((d) => d.complaint.severity === 'High' || d.complaint.severity === 'Critical').length
    return { active, inProgress, resolved, highPriority, total: pool.length }
  }, [pool])

  const filtered = useMemo(() => {
    let list = signal === 'all' ? pool : pool.filter((d) => d.complaint.signal === signal)
    list = [...list].sort((a, b) => {
      if (sort === 'support') return b.complaint.support - a.complaint.support
      if (sort === 'severity') return b.complaint.severityScore - a.complaint.severityScore
      return b.complaint.reportedAt.localeCompare(a.complaint.reportedAt)
    })
    return list
  }, [pool, signal, sort])

  const communityTotal = useMemo(() => pool.reduce((sum, d) => sum + d.complaint.support, 0), [pool])

  const open = openId ? complaints.find((c) => c.id === openId) ?? null : null

  const useCurrent = () => {
    void locate().then((loc) => {
      if (loc) changeLocation(loc)
    })
  }

  const statCards: Array<{ label: string; value: number; accent: string }> = [
    { label: t('community.active'), value: stats.active, accent: 'text-brand-600 dark:text-brand-300' },
    { label: t('community.inProgress'), value: stats.inProgress, accent: 'text-amber-600 dark:text-amber-400' },
    { label: t('community.resolved'), value: stats.resolved, accent: 'text-emerald-civic-deep dark:text-emerald-civic' },
    { label: t('community.highPriority'), value: stats.highPriority, accent: 'text-rose-600 dark:text-rose-400' },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pb-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-civic/20 bg-emerald-civic/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-civic-deep dark:text-emerald-civic">
            <Flame className="h-3.5 w-3.5" />
            {t('community.title')}
          </span>
          <LocationPicker
            t={t}
            location={location}
            radiusKm={radiusKm}
            onLocationChange={changeLocation}
            onRadiusChange={(r) => setRadiusKm(r as never)}
            recentLocations={recentLocations}
            clearRecent={clearRecent}
            onUseCurrentLocation={useCurrent}
            locating={locating}
          />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          <span className="text-gradient-civic">{t('community.title')}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-brand-500 dark:text-brand-300">
          {t('community.sub')}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-brand-100 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4"
            >
              <p className={cn('text-xl font-extrabold', s.accent)}>{s.value}</p>
              <p className="text-[11px] font-semibold text-brand-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
            <Users className="h-4 w-4" />
            {communityTotal} {t('dashboard.supporting')}
          </div>
          <div className="mx-1 hidden h-4 w-px bg-brand-200 sm:block dark:bg-white/10" />
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSignal('all')}
              className={cn(
                'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all',
                signal === 'all'
                  ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                  : 'bg-brand-100/70 text-brand-500 hover:bg-brand-100 dark:bg-white/8 dark:text-brand-300',
              )}
            >
              {t('civicmap.all')}
            </button>
            {SIGNAL_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setSignal(s)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all',
                  signal === s
                    ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                    : 'bg-brand-100/70 text-brand-500 hover:bg-brand-100 dark:bg-white/8 dark:text-brand-300',
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SIGNAL_META[s].color }} />
                {SIGNAL_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-brand-200 p-0.5 dark:border-white/10">
            <ListFilter className="ml-2 h-3.5 w-3.5 text-brand-400" />
            <button
              onClick={() => setSort('recent')}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                sort === 'recent' ? 'bg-brand-100 text-brand-800 dark:bg-white/12 dark:text-white' : 'text-brand-400',
              )}
            >
              {t('community.recent')}
            </button>
            <button
              onClick={() => setSort('support')}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                sort === 'support' ? 'bg-brand-100 text-brand-800 dark:bg-white/12 dark:text-white' : 'text-brand-400',
              )}
            >
              {t('community.mostSupported')}
            </button>
            <button
              onClick={() => setSort('severity')}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                sort === 'severity' ? 'bg-brand-100 text-brand-800 dark:bg-white/12 dark:text-white' : 'text-brand-400',
              )}
            >
              {t('community.highestSeverity')}
            </button>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 dark:text-brand-300">
          <MapPin className="h-3.5 w-3.5 text-emerald-civic-deep dark:text-emerald-civic" />
          {isFallback
            ? t('community.showingNearest').replace('{n}', String(filtered.length))
            : t('community.showing')
                .replace('{n}', String(filtered.length))
                .replace('{r}', `${radiusKm} ${t('community.km')}`)}
          <span className="text-brand-400">·</span>
          <span className="flex items-center gap-1 text-brand-400">
            <Navigation className="h-3 w-3" />
            {location.name}
          </span>
        </p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <CivicFeed
          t={t}
          complaints={filtered.map((d) => d.complaint)}
          isSupported={isSupported}
          onOpen={setOpenId}
          onSupport={onSupport}
        />
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-100 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4">
            <p className="text-sm font-bold text-brand-900 dark:text-white">{t('community.nearbyAreas')}</p>
            <div className="mt-3 space-y-1.5">
              {CIVIC_AREAS.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-brand-500 dark:text-brand-300">{a.name}</span>
                  <span className="font-semibold text-emerald-civic-deep dark:text-emerald-civic">{a.pincode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <ComplaintDetail
          t={t}
          complaint={open}
          distanceLabel={formatDistance(haversineKm(location.lat, location.lng, open.lat, open.lng))}
          isSupported={isSupported(open.id)}
          onClose={() => setOpenId(null)}
          onSupport={onSupport}
          onVerify={(id, v) => onVerify(id, v)}
          onAttachEvidence={() => onAttachEvidence(open.id)}
          onAddComment={(text) => onAddComment(open.id, text)}
        />
      )}
    </div>
  )
}
