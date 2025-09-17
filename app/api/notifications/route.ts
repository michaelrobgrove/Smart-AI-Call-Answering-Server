import { type NextRequest, NextResponse } from "next/server"
import { notificationManager } from "@/lib/notification-manager"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")

    const notifications = notificationManager.getNotifications(limit)

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    switch (action) {
      case "mark_read":
        if (!notificationId) {
          return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
        }
        const marked = notificationManager.markAsRead(notificationId)
        if (!marked) {
          return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }
        break

      case "mark_all_read":
        notificationManager.markAllAsRead()
        break

      case "delete":
        if (!notificationId) {
          return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
        }
        const deleted = notificationManager.deleteNotification(notificationId)
        if (!deleted) {
          return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }
        break

      case "clear_old":
        const deletedCount = notificationManager.clearOldNotifications()
        return NextResponse.json({
          success: true,
          message: `Cleared ${deletedCount} old notifications`,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling notification action:", error)
    return NextResponse.json({ error: "Failed to process notification action" }, { status: 500 })
  }
}
