import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NotificationItem } from '@/types/civic'
import { INITIAL_NOTIFICATIONS } from '@/data/mockData'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadFromStorage<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS),
  )

  useEffect(() => {
    saveToStorage('notifications', notifications)
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const push = useCallback((item: Omit<NotificationItem, 'id' | 'read' | 'time'>) => {
    setNotifications((prev) => [
      {
        ...item,
        id: `n-${Math.random().toString(36).slice(2)}`,
        read: false,
        time: 'Just now',
      },
      ...prev.slice(0, 24),
    ])
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, push }),
    [notifications, unreadCount, markRead, markAllRead, push],
  )
  return value
}
