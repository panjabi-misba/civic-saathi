import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface TrendChartProps {
  t: (key: string) => string
  title: string
  data: { label: string; reported: number; resolved: number }[]
}

export function TrendChart({ t, title, data }: TrendChartProps) {
  return (
    <div>
      <SectionHeader icon={<TrendingUp className="h-4 w-4" />} title={title} subtitle="Last 7 days" />
      <div className="rounded-3xl border border-brand-100 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-brand-900/60">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid rgba(100,116,139,0.2)',
                  fontSize: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              />
              <Area type="monotone" dataKey="reported" stroke="#10b981" strokeWidth={2} fill="url(#gradReported)" name={t('overview.trendReported')} />
              <Area type="monotone" dataKey="resolved" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradResolved)" name={t('overview.trendResolved')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-5 text-[11px] font-semibold text-brand-500 dark:text-brand-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-civic" />
            {t('overview.trendReported')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {t('overview.trendResolved')}
          </span>
        </div>
      </div>
    </div>
  )
}
