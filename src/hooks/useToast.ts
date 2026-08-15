import { useCallback, useMemo, useState } from 'react'
import type { ToastItem } from '@/types/civic'

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastItem['kind'], title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }])
      window.setTimeout(() => dismiss(id), 3800)
      return id
    },
    [dismiss],
  )

  const success = useCallback(
    (title: string, message?: string) => push('success', title, message),
    [push],
  )
  const error = useCallback(
    (title: string, message?: string) => push('error', title, message),
    [push],
  )
  const info = useCallback(
    (title: string, message?: string) => push('info', title, message),
    [push],
  )

  const value = useMemo(
    () => ({ toasts, dismiss, push, success, error, info }),
    [toasts, dismiss, push, success, error, info],
  )

  return value
}
