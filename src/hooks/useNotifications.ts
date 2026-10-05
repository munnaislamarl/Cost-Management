import { useCallback } from 'react'

import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { AppNotification } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Record approved',
    description: 'OPX travel reimbursement has been marked completed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
    tone: 'success',
  },
  {
    id: 'n2',
    title: 'Pending approvals',
    description: '3 records are awaiting finance verification.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: false,
    tone: 'warning',
  },
  {
    id: 'n3',
    title: 'New data exported',
    description: 'Your monthly report export is ready to download.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    read: true,
    tone: 'default',
  },
]

export function useNotifications() {
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    STORAGE_KEYS.notifications,
    SEED_NOTIFICATIONS,
  )

  const unreadCount = notifications.filter((item) => !item.read).length

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      )
    },
    [setNotifications],
  )

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [setNotifications])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
