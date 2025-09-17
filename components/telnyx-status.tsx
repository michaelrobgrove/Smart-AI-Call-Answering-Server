"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Phone, RefreshCw, PhoneCall, Clock, Activity } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TelnyxStatus {
  telnyx: {
    status: string
    configured: boolean
  }
  activeCalls: number
  sessions: Array<{
    callControlId: string
    phoneNumber: string
    startTime: string
    duration: number
    lastActivity: string
  }>
}

export function TelnyxStatus() {
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [testCallData, setTestCallData] = useState({
    to: "",
    from: "",
    connectionId: "",
  })
  const [isCreatingCall, setIsCreatingCall] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const { data, error, mutate } = useSWR<TelnyxStatus>("/api/telnyx/status", fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  })

  const handleTestCall = async () => {
    setIsCreatingCall(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/telnyx/test-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCallData),
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult(`Test call created successfully! Call Control ID: ${result.callControlId}`)
      } else {
        setTestResult(`Error: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsCreatingCall(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "unauthorized":
        return "destructive"
      case "disconnected":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected"
      case "unauthorized":
        return "Unauthorized"
      case "disconnected":
        return "Disconnected"
      default:
        return "Unknown"
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load Telnyx status. Please try again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Telephony Status
          </h1>
          <p className="text-muted-foreground">Monitor Telnyx integration and active calls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PhoneCall className="h-4 w-4 mr-2" />
                Test Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Test Call</DialogTitle>
                <DialogDescription>Create an outbound test call to verify Telnyx integration</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="to">To Number</Label>
                  <Input
                    id="to"
                    placeholder="+1234567890"
                    value={testCallData.to}
                    onChange={(e) => setTestCallData({ ...testCallData, to: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="from">From Number</Label>
                  <Input
                    id="from"
                    placeholder="+1987654321"
                    value={testCallData.from}
                    onChange={(e) => setTestCallData({ ...testCallData, from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="connectionId">Connection ID</Label>
                  <Input
                    id="connectionId"
                    placeholder="Your Telnyx Connection ID"
                    value={testCallData.connectionId}
                    onChange={(e) => setTestCallData({ ...testCallData, connectionId: e.target.value })}
                  />
                </div>
                {testResult && (
                  <Alert variant={testResult.includes("Error") ? "destructive" : "default"}>
                    <AlertDescription>{testResult}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleTestCall} disabled={isCreatingCall} className="w-full">
                  {isCreatingCall ? "Creating Call..." : "Create Test Call"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telnyx Status</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={data ? getStatusColor(data.telnyx.status) : "secondary"}>
                {data ? getStatusLabel(data.telnyx.status) : "Loading..."}
              </Badge>
              {data && !data.telnyx.configured && (
                <Badge variant="destructive" className="text-xs">
                  Not Configured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeCalls || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Endpoint</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono break-all">{`${window.location.origin}/api/webhooks/telnyx`}</div>
            <p className="text-xs text-muted-foreground mt-1">Configure this URL in Telnyx</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Status */}
      {data && !data.telnyx.configured && (
        <Alert>
          <AlertDescription>
            <strong>Telnyx not configured:</strong> Please set the TELNYX_API_KEY environment variable and configure
            your webhook URL in the Telnyx portal.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Call Sessions */}
      {data && data.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Call Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sessions.map((session) => (
                <div key={session.callControlId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{session.phoneNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Call ID: {session.callControlId.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.duration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started {new Date(session.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Environment Variables</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <code className="bg-muted px-2 py-1 rounded">TELNYX_API_KEY</code> - Your Telnyx API key
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded">TELNYX_WEBHOOK_SECRET</code> - Webhook signing secret
                (optional)
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Webhook Configuration</h4>
            <div className="text-sm text-muted-foreground">
              <p>Configure the following webhook URL in your Telnyx portal:</p>
              <code className="bg-muted px-2 py-1 rounded block mt-1 break-all">
                {`${window.location.origin}/api/webhooks/telnyx`}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Required Events</h4>
            <div className="text-sm text-muted-foreground">
              <p>Enable these webhook events in Telnyx:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>call.initiated</li>
                <li>call.answered</li>
                <li>call.hangup</li>
                <li>call.transcription</li>
                <li>call.speak.ended</li>
                <li>call.recording.saved</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
