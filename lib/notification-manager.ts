import { EventEmitter } from "events"

export interface Notification {
  id: string
  type: "call" | "system" | "alert" | "success" | "error"
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

class NotificationManager extends EventEmitter {
  private notifications: Map<string, Notification> = new Map()
  private clients: Set<Response> = new Set()

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    }

    this.notifications.set(id, fullNotification)
    this.emit("notification", fullNotification)

    // Send to all connected SSE clients
    this.broadcastToClients(fullNotification)

    return fullNotification
  }

  getNotifications(limit = 50): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  markAsRead(id: string): boolean {
    const notification = this.notifications.get(id)
    if (notification) {
      notification.read = true
      return true
    }
    return false
  }

  markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      notification.read = true
    }
  }

  deleteNotification(id: string): boolean {
    return this.notifications.delete(id)
  }

  clearOldNotifications(olderThanDays = 7): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    let deletedCount = 0
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.timestamp < cutoffDate) {
        this.notifications.delete(id)
        deletedCount++
      }
    }

    return deletedCount
  }

  // SSE client management
  addClient(response: Response): void {
    this.clients.add(response)
  }

  removeClient(response: Response): void {
    this.clients.delete(response)
  }

  private broadcastToClients(notification: Notification): void {
    const data = JSON.stringify(notification)
    const message = `data: ${data}\n\n`

    for (const client of this.clients) {
      try {
        const writer = client.body?.getWriter()
        if (writer) {
          writer.write(new TextEncoder().encode(message))
        }
      } catch (error) {
        console.error("Error sending notification to client:", error)
        this.clients.delete(client)
      }
    }
  }

  // Convenience methods for common notification types
  notifyIncomingCall(phoneNumber: string, callId: string) {
    return this.addNotification({
      type: "call",
      title: "Incoming Call",
      message: `New call from ${phoneNumber}`,
      data: { phoneNumber, callId, action: "incoming_call" },
    })
  }

  notifyCallEnded(phoneNumber: string, duration: number, outcome: string) {
    return this.addNotification({
      type: "call",
      title: "Call Ended",
      message: `Call with ${phoneNumber} ended (${Math.round(duration)}s) - ${outcome}`,
      data: { phoneNumber, duration, outcome, action: "call_ended" },
    })
  }

  notifySpamDetected(phoneNumber: string, reason: string) {
    return this.addNotification({
      type: "alert",
      title: "Spam Call Blocked",
      message: `Blocked spam call from ${phoneNumber}: ${reason}`,
      data: { phoneNumber, reason, action: "spam_blocked" },
    })
  }

  notifySystemError(error: string, details?: any) {
    return this.addNotification({
      type: "error",
      title: "System Error",
      message: error,
      data: { details, action: "system_error" },
    })
  }

  notifyLeadQualified(phoneNumber: string, leadScore: number) {
    return this.addNotification({
      type: "success",
      title: "New Qualified Lead",
      message: `${phoneNumber} qualified as lead (score: ${leadScore})`,
      data: { phoneNumber, leadScore, action: "lead_qualified" },
    })
  }
}

export const notificationManager = new NotificationManager()
