import type { NextRequest } from "next/server"
import { notificationManager } from "@/lib/notification-manager"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

        // Set up notification listener
        const handleNotification = (notification: any) => {
          const data = JSON.stringify(notification)
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        notificationManager.on("notification", handleNotification)

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          notificationManager.removeListener("notification", handleNotification)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  } catch (error) {
    console.error("Error setting up notification stream:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
