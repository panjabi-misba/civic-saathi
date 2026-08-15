import { AnimatePresence, motion } from 'framer-motion'
import {
  ImagePlus,
  UploadCloud,
  X,
  FileVideo,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import type { MediaItem } from '@/types/civic'
import { cn } from '@/utils/cn'

interface MediaUploaderProps {
  t: (key: string) => string
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
  blurEnabled: boolean
  onBlurToggle: (enabled: boolean) => void
}

const MAX_IMAGE_MB = 15
const MAX_VIDEO_MB = 50
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaUploader({
  t,
  items,
  onChange,
  blurEnabled,
  onBlurToggle,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewBlur, setPreviewBlur] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)

  const addFiles = (files: FileList | null, replaceId?: string) => {
    if (!files || files.length === 0) return
    setError(null)
    const incoming: MediaItem[] = []
    for (const f of Array.from(files).slice(0, 6)) {
      const isVideo = f.type.startsWith('video')
      const sizeOk = isVideo ? f.size <= MAX_VIDEO_MB * 1024 * 1024 : f.size <= MAX_IMAGE_MB * 1024 * 1024
      const typeOk = isVideo ? true : ALLOWED_IMAGE_TYPES.includes(f.type)
      if (!sizeOk) {
        setError(
          `File "${f.name}" is too large. ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB maximum.`,
        )
        continue
      }
      if (!typeOk) {
        setError(`File "${f.name}" is not supported. Use JPG, PNG or WEBP.`)
        continue
      }
      incoming.push({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(f),
      })
    }

    if (replaceId && incoming.length > 0) {
      const rest = items.filter((i) => i.id !== replaceId)
      onChange([...rest, ...incoming])
      setReplacingId(null)
      return
    }
    if (incoming.length > 0) onChange([...items, ...incoming].slice(0, 6))
  }

  const removeItem = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    onChange(items.filter((i) => i.id !== id))
    if (replacingId === id) setReplacingId(null)
  }

  const replaceItem = (id: string) => {
    setReplacingId(id)
    replaceRef.current?.click()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const imageCount = items.filter((i) => i.type === 'image').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-brand-700 dark:text-brand-100">
          {t('vision.uploadEvidence')}
        </p>
        <span className="text-[10px] text-brand-400">JPG · JPEG · PNG · WEBP</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={t('reporter.media')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-emerald-civic bg-emerald-civic/8'
            : 'border-brand-200 bg-brand-50/40 hover:border-brand-300 hover:bg-brand-50/70 dark:border-white/12 dark:bg-white/3 dark:hover:border-white/25',
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-400 shadow-sm dark:bg-white/8 dark:text-brand-200">
          {dragOver ? (
            <UploadCloud className="h-5 w-5 text-emerald-civic" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </span>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-200">
          {t('vision.dragDrop')}{' '}
          <span className="font-semibold text-emerald-civic-deep underline-offset-2 hover:underline dark:text-emerald-civic">
            {t('vision.chooseImage')}
          </span>
        </p>
        <p className="text-[11px] text-brand-400">
          {t('vision.maxSize')} · {imageCount < 6 ? `${imageCount}/6` : '6/6'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-3 py-2 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          {t('vision.chooseImage')}
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white/70 px-3 py-2 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:border-white/12 dark:bg-white/5 dark:text-brand-200"
        >
          <Camera className="h-3.5 w-3.5" />
          {t('vision.useCamera')}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files, replacingId ?? undefined)
          e.target.value = ''
        }}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-[11px] leading-relaxed text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="group relative overflow-hidden rounded-xl border border-brand-200/70 bg-brand-50 dark:border-white/10 dark:bg-white/4"
              >
                <div
                  className={cn(
                    'flex h-20 items-center justify-center bg-brand-100/70 dark:bg-white/6',
                    blurEnabled && previewBlur && 'blur-md',
                  )}
                >
                  {item.previewUrl ? (
                    item.type === 'video' ? (
                      <video src={item.previewUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : item.type === 'video' ? (
                    <FileVideo className="h-7 w-7 text-brand-400" />
                  ) : (
                    <ImagePlus className="h-7 w-7 text-brand-400" />
                  )}
                </div>
                <button
                  onClick={() => replaceItem(item.id)}
                  aria-label={`Replace ${item.name}`}
                  title="Replace"
                  className="absolute left-1 top-1 rounded-full bg-brand-950/70 p-1 text-white opacity-0 transition-opacity hover:bg-sky-500 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="absolute right-1 top-1 rounded-full bg-brand-950/70 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="px-1.5 py-1">
                  <p className="truncate text-[10px] font-medium text-brand-600 dark:text-brand-200">
                    {item.name}
                  </p>
                  <p className="text-[9px] text-brand-400">{formatSize(item.size)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white/70 px-3.5 py-3 dark:border-white/8 dark:bg-white/4">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                blurEnabled
                  ? 'bg-emerald-civic/15 text-emerald-civic-deep dark:text-emerald-civic'
                  : 'bg-brand-100 text-brand-400 dark:bg-white/8',
              )}
            >
              {blurEnabled ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-100">
                {t('reporter.privacyShield')}
              </p>
              <p className="text-[10px] text-brand-400">{t('vision.privacyShieldDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreviewBlur((b) => !b)}
              aria-label="Toggle blur preview"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                previewBlur
                  ? 'border-emerald-civic bg-emerald-civic/10 text-emerald-civic-deep dark:text-emerald-civic'
                  : 'border-brand-200 text-brand-400 hover:bg-brand-50 dark:border-white/12 dark:hover:bg-white/8',
              )}
            >
              {previewBlur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              role="switch"
              aria-checked={blurEnabled}
              aria-label={t('reporter.privacyShield')}
              onClick={() => onBlurToggle(!blurEnabled)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                blurEnabled ? 'bg-emerald-civic' : 'bg-brand-200 dark:bg-white/15',
              )}
            >
              <motion.span
                animate={{ x: blurEnabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
