"use client"

import { useState, useEffect, useCallback } from "react"
import type { Notification } from "@/lib/notification-manager"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [])

  // Set up SSE connection
  useEffect(() => {
    fetchNotifications()

    const eventSource = new EventSource("/api/notifications/stream")

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "connected") {
          return
        }

        // Add new notification
        setNotifications((prev) => [data, ...prev].slice(0, 50)) // Keep only latest 50
        if (!data.read) {
          setUnreadCount((prev) => prev + 1)
        }
      } catch (error) {
        console.error("Error parsing notification:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", notificationId }),
        })

        if (response.ok) {
          const notification = notifications.find((n) => n.id === notificationId)
          setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
          if (notification && !notification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error)
      }
    },
    [notifications],
  )

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  }
}
