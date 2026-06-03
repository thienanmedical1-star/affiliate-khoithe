'use client'
import { useState, useEffect } from 'react'
import Pusher from 'pusher-js'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unread = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(setNotifications)

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
    const channel = pusher.subscribe(`user-${userId}`)
    channel.bind('notification', (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
      const n: Notification = { ...data, id: Date.now().toString(), isRead: false, createdAt: new Date().toISOString() }
      setNotifications(prev => [n, ...prev])
    })
    return () => { pusher.disconnect() }
  }, [userId])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT' })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const iconMap: Record<string, string> = { payment: '💰', customer: '👤', commission: '🎁', sync: '🔄' }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-800">Thông báo</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Đánh dấu đã đọc</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Chưa có thông báo</p>
            ) : notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex gap-2">
                  <span className="text-lg">{iconMap[n.type] || '🔔'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
