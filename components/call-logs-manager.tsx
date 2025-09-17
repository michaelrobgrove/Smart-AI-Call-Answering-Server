"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Search, Clock, User, Building, MessageSquare, ExternalLink, Filter } from "lucide-react"
import useSWR from "swr"

interface Contact {
  id: number
  name?: string
  company?: string
  phone_number: string
  email?: string
  is_spam: boolean
  created_at: string
  updated_at: string
}

interface CallLog {
  id: number
  contact_id?: number
  call_id: string
  phone_number: string
  direction: "inbound" | "outbound"
  status: "answered" | "missed" | "transferred" | "spam" | "voicemail"
  duration: number
  transcript?: string
  summary?: string
  lead_qualified: boolean
  caller_name?: string
  caller_company?: string
  reason_for_call?: string
  transferred_to_human: boolean
  started_at: string
  ended_at?: string
  created_at: string
  contact?: Contact
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors = {
  answered: "default",
  missed: "secondary",
  transferred: "outline",
  spam: "destructive",
  voicemail: "secondary",
} as const

const statusLabels = {
  answered: "Answered",
  missed: "Missed",
  transferred: "Transferred",
  spam: "Spam",
  voicemail: "Voicemail",
}

export function CallLogsManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [selectedContact, setSelectedContact] = useState<{ contact: Contact; calls: CallLog[] } | null>(null)
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  const {
    data,
    error: fetchError,
    mutate,
  } = useSWR(`/api/calls?limit=100&status=${statusFilter}&phone=${encodeURIComponent(searchTerm)}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const calls: CallLog[] = data?.calls || []

  // Group calls by contact
  const groupedCalls = calls.reduce(
    (acc, call) => {
      const key = call.contact?.id || call.phone_number
      if (!acc[key]) {
        acc[key] = {
          contact: call.contact || {
            id: 0,
            phone_number: call.phone_number,
            name: call.caller_name,
            company: call.caller_company,
            is_spam: call.status === "spam",
          },
          calls: [],
        }
      }
      acc[key].calls.push(call)
      return acc
    },
    {} as Record<string, { contact: Contact | any; calls: CallLog[] }>,
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const handleViewCall = async (call: CallLog) => {
    try {
      const response = await fetch(`/api/calls/${call.id}`)
      const result = await response.json()

      if (response.ok) {
        setSelectedCall(result.call)
        setIsCallDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching call details:", error)
    }
  }

  const handleViewContact = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/calls`)
      const result = await response.json()

      if (response.ok) {
        setSelectedContact(result)
        setIsContactDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching contact details:", error)
    }
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load call logs. Please try again.</AlertDescription>
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
            Call Logs
          </h1>
          <p className="text-muted-foreground">View and manage call history and transcripts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by phone number, name, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call logs */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual Calls</TabsTrigger>
          <TabsTrigger value="grouped">Grouped by Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          {calls.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No calls found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "Call logs will appear here once the AI agent starts receiving calls."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => {
                const { date, time } = formatDateTime(call.started_at)
                return (
                  <Card key={call.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {call.caller_name || call.contact?.name || "Unknown Caller"}
                              </h3>
                              <Badge variant={statusColors[call.status]}>{statusLabels[call.status]}</Badge>
                              {call.lead_qualified && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Qualified Lead
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {call.phone_number}
                              </span>
                              {(call.caller_company || call.contact?.company) && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {call.caller_company || call.contact?.company}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(call.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{date}</div>
                            <div>{time}</div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewCall(call)}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                      {call.reason_for_call && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">
                            <strong>Reason for call:</strong> {call.reason_for_call}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grouped" className="space-y-4">
          {Object.keys(groupedCalls).length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                  <p className="text-muted-foreground">Contacts will appear here once calls are received.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedCalls).map(({ contact, calls: contactCalls }) => {
                const latestCall = contactCalls[0]
                const totalCalls = contactCalls.length
                const qualifiedLeads = contactCalls.filter((c) => c.lead_qualified).length

                return (
                  <Card key={contact.id || contact.phone_number} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{contact.name || "Unknown Contact"}</h3>
                              {contact.is_spam && <Badge variant="destructive">Spam</Badge>}
                              {qualifiedLeads > 0 && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  {qualifiedLeads} Qualified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone_number}
                              </span>
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {contact.company}
                                </span>
                              )}
                              <span>
                                {totalCalls} call{totalCalls !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm text-muted-foreground">
                            <div>Last call:</div>
                            <div>{formatDateTime(latestCall.started_at).date}</div>
                          </div>
                          {contact.id && (
                            <Button variant="outline" size="sm" onClick={() => handleViewContact(contact.id)}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View History
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Call Details Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
            <DialogDescription>Complete information and transcript for this call</DialogDescription>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-6">
              {/* Call Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Caller</Label>
                  <p className="text-sm">{selectedCall.caller_name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm">{selectedCall.phone_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm">{selectedCall.caller_company || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={statusColors[selectedCall.status]}>{statusLabels[selectedCall.status]}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p className="text-sm">{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Started At</Label>
                  <p className="text-sm">
                    {formatDateTime(selectedCall.started_at).date} at {formatDateTime(selectedCall.started_at).time}
                  </p>
                </div>
              </div>

              {/* Lead Information */}
              {selectedCall.lead_qualified && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Qualified Lead Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-green-700">Name</Label>
                      <p>{selectedCall.caller_name || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-green-700">Company</Label>
                      <p>{selectedCall.caller_company || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-green-700">Reason for Call</Label>
                      <p>{selectedCall.reason_for_call || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedCall.summary && (
                <div>
                  <Label className="text-sm font-medium">Call Summary</Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedCall.summary}</p>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {selectedCall.transcript && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Call Transcript
                  </Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{selectedCall.transcript}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact History Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact History</DialogTitle>
            <DialogDescription>Complete call history for this contact</DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedContact.contact.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm">{selectedContact.contact.phone_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm">{selectedContact.contact.company || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Calls</Label>
                  <p className="text-sm">{selectedContact.calls.length}</p>
                </div>
              </div>

              {/* Call History */}
              <div>
                <Label className="text-sm font-medium">Call History</Label>
                <div className="mt-2 space-y-3">
                  {selectedContact.calls.map((call) => {
                    const { date, time } = formatDateTime(call.started_at)
                    return (
                      <div key={call.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusColors[call.status]}>{statusLabels[call.status]}</Badge>
                            {call.lead_qualified && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Qualified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {date} at {time} • {formatDuration(call.duration)}
                          </div>
                        </div>
                        {call.reason_for_call && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Reason:</strong> {call.reason_for_call}
                          </p>
                        )}
                        {call.summary && (
                          <p className="text-sm mt-1">
                            <strong>Summary:</strong> {call.summary}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
