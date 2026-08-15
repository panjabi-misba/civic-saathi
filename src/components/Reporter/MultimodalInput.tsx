import { AnimatePresence, motion } from 'framer-motion'
import { Mic, X, Type, ImageIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CivicLocation, MediaItem } from '@/types/civic'
import { VoiceRecorder } from '@/components/Reporter/VoiceRecorder'
import { MediaUploader } from '@/components/Reporter/MediaUploader'
import { LocationSearch } from '@/components/location/LocationSearch'
import { cn } from '@/utils/cn'

interface MultimodalInputProps {
  t: (key: string) => string
  text: string
  onTextChange: (text: string) => void
  locationValue: CivicLocation | null
  onLocationSelect: (loc: CivicLocation | null) => void
  recentLocations: CivicLocation[]
  clearRecent: () => void
  onUseCurrentLocation: () => void
  locating: boolean
  media: MediaItem[]
  onMediaChange: (media: MediaItem[]) => void
  blurEnabled: boolean
  onBlurToggle: (enabled: boolean) => void
}

type Tab = 'text' | 'voice' | 'media'

const tabs: { key: Tab; icon: typeof Type; label: string }[] = [
  { key: 'text', icon: Type, label: 'Text' },
  { key: 'voice', icon: Mic, label: 'Voice' },
  { key: 'media', icon: ImageIcon, label: 'Media' },
]

export function MultimodalInput({
  t,
  text,
  onTextChange,
  locationValue,
  onLocationSelect,
  recentLocations,
  clearRecent,
  onUseCurrentLocation,
  locating,
  media,
  onMediaChange,
  blurEnabled,
  onBlurToggle,
}: MultimodalInputProps) {
  const [tab, setTab] = useState<Tab>('text')
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`
  }, [text])

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Input mode"
        className="inline-flex rounded-xl border border-brand-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5"
      >
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon
          const active = tab === tabItem.key
          return (
            <button
              key={tabItem.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tabItem.key)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'text-brand-900 dark:text-white'
                  : 'text-brand-400 hover:text-brand-600 dark:hover:text-brand-200',
              )}
            >
              {active && (
                <motion.span
                  layoutId="input-tab-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative">{tabItem.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'text' && (
          <motion.div
            key="text-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative">
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={t('reporter.placeholder')}
                rows={3}
                aria-label={t('reporter.placeholder')}
                className="w-full resize-none rounded-2xl border border-brand-200 bg-white/80 p-4 pr-9 text-[15px] leading-relaxed text-brand-900 shadow-inner transition-colors placeholder:text-brand-300 focus:border-emerald-civic focus:outline-none dark:border-white/12 dark:bg-brand-900/60 dark:text-brand-50 dark:placeholder:text-brand-500"
              />
              {text && (
                <button
                  onClick={() => onTextChange('')}
                  aria-label="Clear text"
                  className="absolute right-3 top-3 rounded-full p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {!text && (
              <p className="mt-2 text-[11px] text-brand-400">{t('reporter.placeholderHint')}</p>
            )}
          </motion.div>
        )}

        {tab === 'voice' && (
          <motion.div
            key="voice-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <VoiceRecorder
              t={t}
              onTranscribed={(spoken) => {
                onTextChange(text ? `${text.trim()} ${spoken}` : spoken)
                setTab('text')
              }}
            />
          </motion.div>
        )}

        {tab === 'media' && (
          <motion.div
            key="media-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <MediaUploader
              t={t}
              items={media}
              onChange={onMediaChange}
              blurEnabled={blurEnabled}
              onBlurToggle={onBlurToggle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <LocationSearch
        t={t}
        value={locationValue}
        onChange={onLocationSelect}
        placeholder={t('reporter.locationPlaceholder')}
        recentLocations={recentLocations}
        clearRecent={clearRecent}
        onUseCurrentLocation={onUseCurrentLocation}
        locating={locating}
      />
    </div>
  )
}
