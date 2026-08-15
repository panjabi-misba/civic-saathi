import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, Megaphone, Plus, RefreshCw, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Complaint, ThemeMode } from '@/types/civic'
import { CIVIC_INSIGHTS, CIVIC_ALERTS, AUTHORITY_ACTIVITY } from '@/data/mockData'
import { useLocation } from '@/hooks/useLocation'
import { useGeolocation } from '@/hooks/useGeolocation'
import { CivicAlerts } from '@/components/dashboard/CivicAlerts'
import { StatCard } from '@/components/dashboard/StatCard'
import { HealthGauge } from '@/components/dashboard/HealthGauge'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { CivicMap } from '@/components/dashboard/CivicMap'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { CivicFeed } from '@/components/dashboard/CivicFeed'
import { AuthorityActivity } from '@/components/dashboard/AuthorityActivity'
import { LocationPicker } from '@/components/location/LocationPicker'
import { haversineKm } from '@/utils/geo'

interface OverviewProps {
  t: (key: string) => string
  complaints: Complaint[]
  theme: ThemeMode
  isSupported: (id: string) => boolean
  onSupport: (id: string) => void
  onOpenComplaint: (id: string) => void
  onReport: () => void
  onViewAll: () => void
  onAskAssistant: (question: string) => void
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function areaOf(c: Complaint): string {
  return typeof c.area === 'string' ? c.area : ''
}

function reportDayOf(c: Complaint): string {
  return typeof c.reportedAt === 'string' ? c.reportedAt.slice(0, 10) : ''
}

export function Overview({
  t,
  complaints,
  theme,
  isSupported,
  onSupport,
  onOpenComplaint,
  onReport,
  onViewAll,
  onAskAssistant,
}: OverviewProps) {
  const { location, radiusKm, recentLocations, changeLocation, setRadiusKm, clearRecent } = useLocation()
  const { locating, locate } = useGeolocation()
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})

  const areaName = location.area
  const areaToken = areaName.split(' ')[0]

  const areaComplaints = useMemo(
    () => complaints.filter((c) => areaOf(c) === areaName || areaOf(c).includes(areaToken)),
    [complaints, areaName, areaToken],
  )

  const nearComplaints = useMemo(() => {
    const withDistance = complaints
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
      .map((c) => ({ c, d: haversineKm(location.lat, location.lng, c.lat, c.lng) }))
      .sort((a, b) => a.d - b.d)
    const within = withDistance.filter((x) => x.d <= radiusKm)
    return (within.length > 0 ? within : withDistance.slice(0, 6)).map((x) => x.c)
  }, [complaints, location, radiusKm])

  const stats = useMemo(() => {
    const active = areaComplaints.filter((c) => c.status !== 'Resolved').length
    const resolved = areaComplaints.filter((c) => c.status === 'Resolved').length
    const inProgress = areaComplaints.filter(
      (c) => c.status === 'In Progress' || c.status === 'Assigned',
    ).length
    const communityReports = areaComplaints.reduce((sum, c) => sum + c.reportCount, 0)
    return { active, resolved, inProgress, communityReports }
  }, [areaComplaints])

  const healthScore = useMemo(() => {
    const total = areaComplaints.length
    if (total === 0) return 85
    const resolved = areaComplaints.filter((c) => c.status === 'Resolved').length
    const critical = areaComplaints.filter((c) => c.severity === 'Critical').length
    return Math.max(40, Math.min(95, 78 + Math.round((resolved / total) * 20) - critical * 3))
  }, [areaComplaints])

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const key = date.toISOString().slice(0, 10)
      const day = date.getDay()
      return {
        label: DAY_LABELS[day],
        reported: complaints.filter((c) => reportDayOf(c) === key).length,
        resolved: complaints.filter(
          (c) => c.status === 'Resolved' && reportDayOf(c) === key,
        ).length,
      }
    })
    return days
  }, [complaints])

  const visibleAlertsList = CIVIC_ALERTS.filter((a) => !dismissed[a.id])
  const nearbyForMap = nearComplaints.slice(0, 20)

  const useCurrent = () => {
    void locate().then((loc) => {
      if (loc) changeLocation(loc)
    })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-civic/20 bg-emerald-civic/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-civic-deep dark:text-emerald-civic">
              <MapPin className="h-3.5 w-3.5" />
              {t('overview.title')}
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              <span className="text-gradient-civic">{t('dashboard.yourCivicArea')}</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-500 dark:text-brand-300">
              {t('overview.sub').replace('{area}', areaName)}
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onReport}
              className="flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 dark:bg-white dark:text-brand-900 dark:hover:bg-brand-100"
            >
              <Plus className="h-4 w-4" />
              {t('dashboard.reportIssue')}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 space-y-6">
        <CivicAlerts
          alerts={visibleAlertsList}
          visible={visibleAlertsList.length > 0}
          onDismiss={(id) => setDismissed((d) => ({ ...d, [id]: true }))}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            index={0}
            icon={<Megaphone className="h-4 w-4" />}
            label={t('dashboard.activeIssues')}
            value={stats.active}
            accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          />
          <StatCard
            index={1}
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={t('dashboard.resolvedThisMonth')}
            value={stats.resolved}
            accent="bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic"
          />
          <StatCard
            index={2}
            icon={<RefreshCw className="h-4 w-4" />}
            label={t('dashboard.inProgress')}
            value={stats.inProgress}
            accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
          <StatCard
            index={3}
            icon={<Users className="h-4 w-4" />}
            label={t('dashboard.communityReports')}
            value={stats.communityReports}
            accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <HealthGauge
            score={healthScore}
            label={t('overview.healthStatus')}
            statusLabel={t('dashboard.healthGood')}
            explanation={t('dashboard.healthExplanation')}
          />
          <TrendChart t={t} title={t('overview.trendTitle')} data={trend} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CivicMap
            t={t}
            complaints={nearbyForMap}
            center={[location.lat, location.lng]}
            theme={theme}
            selectedId={null}
            onSelect={onOpenComplaint}
          />
          <AIInsights t={t} insights={CIVIC_INSIGHTS} onAsk={onAskAssistant} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CivicFeed
            t={t}
            complaints={nearComplaints}
            isSupported={isSupported}
            onOpen={onOpenComplaint}
            onSupport={onSupport}
            onViewAll={onViewAll}
            viewAllLabel={t('dashboard.viewAll')}
            title={t('dashboard.nearbyTitle')}
            subtitle={areaName}
          />
          <AuthorityActivity t={t} activities={AUTHORITY_ACTIVITY} limit={5} />
        </div>
      </div>
    </div>
  )
}
