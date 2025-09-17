"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, Trash2, Phone, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "@/hooks/use-notifications"
import type { Notification } from "@/lib/notification-manager"
import { cn } from "@/lib/utils"

const notificationIcons = {
  call: Phone,
  system: Info,
  alert: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
}

const notificationColors = {
  call: "text-blue-600",
  system: "text-gray-600",
  alert: "text-amber-600",
  success: "text-green-600",
  error: "text-red-600",
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const Icon = notificationIcons[notification.type]
  const iconColor = notificationColors[notification.type]

  return (
    <Card className={cn("p-3 transition-colors", !notification.read && "bg-blue-50 border-blue-200")}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.read && (
                <Button variant="ghost" size="sm" onClick={() => onMarkRead(notification.id)} className="h-6 w-6 p-0">
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
