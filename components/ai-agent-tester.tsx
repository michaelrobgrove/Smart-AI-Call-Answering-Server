"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, MessageSquare, User } from "lucide-react"

interface TestResult {
  response: string
  shouldTransfer: boolean
  callComplete: boolean
  leadQualified: boolean
  spamDetected: boolean
  context: any
  transcript: string
  summary: string
}

export function AIAgentTester() {
  const [message, setMessage] = useState("")
  const [conversation, setConversation] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process message")
      }

      // Add messages to conversation
      const newConversation = [
        ...conversation,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: result.response },
      ]

      setConversation(newConversation)
      setLastResult(result)
      setMessage("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearConversation = () => {
    setConversation([])
    setLastResult(null)
    setError(null)
  }

  const testScenarios = [
    {
      name: "Lead Qualification",
      message: "Hi, my name is John Smith from ABC Corp. I'm interested in your services.",
    },
    {
      name: "Spam Detection",
      message: "This is a robocall about your car's extended warranty. Press 1 to continue.",
    },
    {
      name: "Transfer Request",
      message: "I need to speak to someone about pricing for your enterprise solutions.",
    },
    {
      name: "Knowledge Base Query",
      message: "What are your business hours?",
    },
    {
      name: "General Inquiry",
      message: "Hello, I'm looking for information about your company.",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Agent Tester
          </h1>
          <p className="text-muted-foreground">Test the AI phone agent's responses and behavior</p>
        </div>
        <Button variant="outline" onClick={clearConversation}>
          Clear Conversation
        </Button>
      </div>

      {/* Quick Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {testScenarios.map((scenario) => (
              <Button
                key={scenario.name}
                variant="outline"
                size="sm"
                onClick={() => setMessage(scenario.message)}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium">{scenario.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{scenario.message}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Conversation History */}
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                {conversation.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start a conversation with the AI agent</p>
                  </div>
                ) : (
                  conversation.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          <span className="text-xs font-medium">{msg.role === "user" ? "Caller" : "AI Agent"}</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="message" className="sr-only">
                      Message
                    </Label>
                    <Input
                      id="message"
                      placeholder="Type a message as the caller..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                    />
                  </div>
                  <Button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <div className="space-y-4">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={lastResult.leadQualified ? "default" : "secondary"}>
                    {lastResult.leadQualified ? "Lead Qualified" : "Not Qualified"}
                  </Badge>
                  <Badge variant={lastResult.spamDetected ? "destructive" : "secondary"}>
                    {lastResult.spamDetected ? "Spam Detected" : "Not Spam"}
                  </Badge>
                  <Badge variant={lastResult.shouldTransfer ? "outline" : "secondary"}>
                    {lastResult.shouldTransfer ? "Transfer Requested" : "No Transfer"}
                  </Badge>
                  <Badge variant={lastResult.callComplete ? "default" : "secondary"}>
                    {lastResult.callComplete ? "Call Complete" : "Ongoing"}
                  </Badge>
                </div>

                {/* Extracted Information */}
                {lastResult.context && (
                  <div>
                    <Label className="text-sm font-medium">Extracted Information</Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>Name:</strong> {lastResult.context.callerName || "Not provided"}
                        </div>
                        <div>
                          <strong>Company:</strong> {lastResult.context.callerCompany || "Not provided"}
                        </div>
                        <div className="col-span-2">
                          <strong>Reason:</strong> {lastResult.context.reasonForCall || "Not provided"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {lastResult.summary && (
                  <div>
                    <Label className="text-sm font-medium">Call Summary</Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{lastResult.summary}</p>
                    </div>
                  </div>
                )}

                {/* Full Transcript */}
                {lastResult.transcript && (
                  <div>
                    <Label className="text-sm font-medium">Full Transcript</Label>
                    <Textarea value={lastResult.transcript} readOnly className="mt-2 h-32 text-sm font-mono" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Send a message to see analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
