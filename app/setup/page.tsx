"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface SetupData {
  // Admin User
  adminName: string
  adminUsername: string
  adminPassword: string
  adminEmail: string

  // Company Info
  companyName: string
  companyDescription: string
  businessHours: string
  contactPhone: string
  contactEmail: string

  // AI Configuration
  systemPrompt: string
  aiProvider: string
  aiModel: string
  maxTokens: number
  temperature: number

  // API Keys
  telnyxApiKey: string
  telnyxWebhookSecret: string
  geminiApiKey: string // Used for both Gemini and OpenAI for simplicity

  // Features
  enableSpamDetection: boolean
  enableCallRecording: boolean
  enableTranscription: boolean
  enableNotifications: boolean
}

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [setupData, setSetupData] = useState<SetupData>({
    // Admin User
    adminName: "",
    adminUsername: "admin",
    adminPassword: "",
    adminEmail: "",

    // Company Info
    companyName: "",
    companyDescription: "",
    businessHours: "Monday-Friday 9AM-5PM EST",
    contactPhone: "",
    contactEmail: "",

    // AI Configuration
    systemPrompt: `You are an AI phone agent for {COMPANY_NAME}. Your role is to:

1. Answer incoming calls professionally and courteously
2. Qualify leads by gathering contact information and understanding their needs
3. Provide information about our services and company
4. Transfer qualified leads to human agents when appropriate
5. Block spam calls and handle routine inquiries

Key guidelines:
- Always be polite and professional
- Ask for the caller's name and company early in the conversation
- Listen for buying signals and qualification criteria
- Use the knowledge base to answer common questions
- Transfer to human agents for complex sales discussions or technical support

Company Information:
- Name: {COMPANY_NAME}
- Description: {COMPANY_DESCRIPTION}
- Business Hours: {BUSINESS_HOURS}
- Contact: {CONTACT_PHONE} / {CONTACT_EMAIL}`,
    aiProvider: "gemini",
    aiModel: "gemini-1.5-pro",
    maxTokens: 500,
    temperature: 0.7,

    // API Keys
    telnyxApiKey: "",
    telnyxWebhookSecret: "",
    geminiApiKey: "", // Used for both providers

    // Features
    enableSpamDetection: true,
    enableCallRecording: true,
    enableTranscription: true,
    enableNotifications: true,
  })

  const steps = [
    { id: "admin", title: "Admin Account", description: "Create your admin account" },
    { id: "company", title: "Company Info", description: "Configure your company details" },
    { id: "ai", title: "AI Configuration", description: "Set up the AI agent behavior" },
    { id: "integrations", title: "API Keys", description: "Configure external services" },
    { id: "features", title: "Features", description: "Enable optional features" },
    { id: "review", title: "Review", description: "Review and complete setup" },
  ]

  // Check if setup is already completed
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch("/api/setup/status")
        const data = await response.json()

        if (data.isSetup) {
          // Redirect to home if setup is complete
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Failed to check setup status:", error)
      }
    }

    checkSetupStatus()
  }, [])

  const handleInputChange = (field: keyof SetupData, value: string | number | boolean) => {
    setSetupData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Admin
        return !!(setupData.adminName && setupData.adminUsername && setupData.adminPassword && setupData.adminEmail)
      case 1: // Company
        return !!(
          setupData.companyName &&
          setupData.companyDescription &&
          setupData.contactPhone &&
          setupData.contactEmail
        )
      case 2: // AI
        return !!(setupData.systemPrompt && setupData.aiModel)
      case 3: // Integrations
        return !!(setupData.telnyxApiKey && setupData.geminiApiKey)
      case 4: // Features
        return true // All optional
      case 5: // Review
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      setError(null)
    } else {
      setError("Please fill in all required fields before continuing.")
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    setError(null)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setupData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Setup failed")
      }

      setSuccess(true)

      // Redirect to home page after 3 seconds, not login
      setTimeout(() => {
        window.location.href = "/"
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Setup failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Setup Complete!</h2>
            <p className="text-muted-foreground mb-4">Your AI Phone Agent system has been configured successfully.</p>
            <div className="space-y-2 mb-4 text-left">
              <p className="text-sm">
                <strong>Admin Login:</strong>
              </p>
              <p className="text-sm font-mono bg-muted p-2 rounded">Username: admin</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">Password: admin123</p>
            </div>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Phone Agent Setup</h1>
            <p className="text-muted-foreground">Configure your autonomous phone agent system</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 0: Admin Account */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminName">Full Name *</Label>
                      <Input
                        id="adminName"
                        value={setupData.adminName}
                        onChange={(e) => handleInputChange("adminName", e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminUsername">Username *</Label>
                      <Input
                        id="adminUsername"
                        value={setupData.adminUsername}
                        onChange={(e) => handleInputChange("adminUsername", e.target.value)}
                        placeholder="admin"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={setupData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      placeholder="Choose a strong password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={setupData.adminEmail}
                      onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                      placeholder="admin@company.com"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Used for password reset and system notifications
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={setupData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyDescription">Company Description *</Label>
                    <Textarea
                      id="companyDescription"
                      value={setupData.companyDescription}
                      onChange={(e) => handleInputChange("companyDescription", e.target.value)}
                      placeholder="Brief description of your company and services..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        value={setupData.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={setupData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="businessHours">Business Hours</Label>
                    <Input
                      id="businessHours"
                      value={setupData.businessHours}
                      onChange={(e) => handleInputChange("businessHours", e.target.value)}
                      placeholder="Monday-Friday 9AM-5PM EST"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: AI Configuration */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="systemPrompt">System Prompt *</Label>
                    <Textarea
                      id="systemPrompt"
                      value={setupData.systemPrompt}
                      onChange={(e) => handleInputChange("systemPrompt", e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      This defines how your AI agent behaves. Variables like {"{COMPANY_NAME}"} will be replaced
                      automatically.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="aiProvider">AI Provider *</Label>
                      <select
                        id="aiProvider"
                        value={setupData.aiProvider}
                        onChange={(e) => {
                          handleInputChange("aiProvider", e.target.value)
                          if (e.target.value === "gemini") {
                            handleInputChange("aiModel", "gemini-1.5-pro")
                          } else if (e.target.value === "openai") {
                            handleInputChange("aiModel", "gpt-4")
                          }
                        }}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                      >
                        <option value="gemini">Google Gemini (Recommended)</option>
                        <option value="openai">OpenAI GPT</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gemini offers better pricing and performance
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="aiModel">AI Model *</Label>
                      <select
                        id="aiModel"
                        value={setupData.aiModel}
                        onChange={(e) => handleInputChange("aiModel", e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                      >
                        {setupData.aiProvider === "gemini" ? (
                          <>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Faster)</option>
                            <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                          </>
                        ) : (
                          <>
                            <option value="gpt-4">GPT-4 (Recommended)</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheaper)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={setupData.maxTokens}
                        onChange={(e) => handleInputChange("maxTokens", Number.parseInt(e.target.value))}
                        min="100"
                        max="2000"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Response length limit</p>
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        value={setupData.temperature}
                        onChange={(e) => handleInputChange("temperature", Number.parseFloat(e.target.value))}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Creativity (0.0-1.0)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: API Keys */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      These API keys are required for the system to function. They will be stored securely as
                      environment variables.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="telnyxApiKey">Telnyx API Key *</Label>
                    <Input
                      id="telnyxApiKey"
                      type="password"
                      value={setupData.telnyxApiKey}
                      onChange={(e) => handleInputChange("telnyxApiKey", e.target.value)}
                      placeholder="KEY_your_telnyx_api_key_here"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Get this from your{" "}
                      <a
                        href="https://portal.telnyx.com/app/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Telnyx Portal → API Keys
                      </a>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="telnyxWebhookSecret">Telnyx Webhook Secret (Optional)</Label>
                    <Input
                      id="telnyxWebhookSecret"
                      type="password"
                      value={setupData.telnyxWebhookSecret}
                      onChange={(e) => handleInputChange("telnyxWebhookSecret", e.target.value)}
                      placeholder="Optional webhook signing secret"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended for security - set this in your Telnyx application
                    </p>
                  </div>

                  {setupData.aiProvider === "gemini" ? (
                    <div>
                      <Label htmlFor="geminiApiKey">Google Gemini API Key *</Label>
                      <Input
                        id="geminiApiKey"
                        type="password"
                        value={setupData.geminiApiKey}
                        onChange={(e) => handleInputChange("geminiApiKey", e.target.value)}
                        placeholder="AIza..."
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Get this from{" "}
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Google AI Studio
                        </a>{" "}
                        - Free tier available!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="openaiApiKey">OpenAI API Key *</Label>
                      <Input
                        id="openaiApiKey"
                        type="password"
                        value={setupData.geminiApiKey} // Note: using same field for simplicity
                        onChange={(e) => handleInputChange("geminiApiKey", e.target.value)}
                        placeholder="sk-..."
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Get this from your{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          OpenAI Dashboard → API Keys
                        </a>
                      </p>
                    </div>
                  )}

                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-medium mb-2">💡 Getting Started Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Gemini (Recommended):</strong> Free tier, fast responses, good for most use cases</li>
                      <li>• <strong>OpenAI:</strong> More expensive but potentially better for complex conversations</li>
                      <li>• <strong>Telnyx:</strong> You'll need to purchase a phone number (~$1/month) after setup</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 4: Features */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableSpamDetection">Spam Detection</Label>
                      <p className="text-sm text-muted-foreground">Automatically detect and block spam calls</p>
                    </div>
                    <Switch
                      id="enableSpamDetection"
                      checked={setupData.enableSpamDetection}
                      onCheckedChange={(checked) => handleInputChange("enableSpamDetection", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableCallRecording">Call Recording</Label>
                      <p className="text-sm text-muted-foreground">Record calls for quality assurance and training</p>
                    </div>
                    <Switch
                      id="enableCallRecording"
                      checked={setupData.enableCallRecording}
                      onCheckedChange={(checked) => handleInputChange("enableCallRecording", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableTranscription">Call Transcription</Label>
                      <p className="text-sm text-muted-foreground">Generate transcripts of all calls</p>
                    </div>
                    <Switch
                      id="enableTranscription"
                      checked={setupData.enableTranscription}
                      onCheckedChange={(checked) => handleInputChange("enableTranscription", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableNotifications">Real-time Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified of important calls and events</p>
                    </div>
                    <Switch
                      id="enableNotifications"
                      checked={setupData.enableNotifications}
                      onCheckedChange={(checked) => handleInputChange("enableNotifications", checked)}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Alert>
                    <AlertDescription>Please review your configuration before completing the setup.</AlertDescription>
                  </Alert>

                  <Tabs defaultValue="admin" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="admin">Admin</TabsTrigger>
                      <TabsTrigger value="company">Company</TabsTrigger>
                      <TabsTrigger value="ai">AI Config</TabsTrigger>
                      <TabsTrigger value="keys">API Keys</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                    </TabsList>

                    <TabsContent value="admin" className="space-y-2 pt-4">
                      <div>
                        <strong>Name:</strong> {setupData.adminName}
                      </div>
                      <div>
                        <strong>Username:</strong> {setupData.adminUsername}
                      </div>
                      <div>
                        <strong>Email:</strong> {setupData.adminEmail}
                      </div>
                    </TabsContent>

                    <TabsContent value="company" className="space-y-2 pt-4">
                      <div>
                        <strong>Company:</strong> {setupData.companyName}
                      </div>
                      <div>
                        <strong>Description:</strong> {setupData.companyDescription}
                      </div>
                      <div>
                        <strong>Phone:</strong> {setupData.contactPhone}
                      </div>
                      <div>
                        <strong>Email:</strong> {setupData.contactEmail}
                      </div>
                      <div>
                        <strong>Hours:</strong> {setupData.businessHours}
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-2 pt-4">
                      <div>
                        <strong>Provider:</strong> <span className="capitalize">{setupData.aiProvider}</span>
                      </div>
                      <div>
                        <strong>Model:</strong> {setupData.aiModel}
                      </div>
                      <div>
                        <strong>Max Tokens:</strong> {setupData.maxTokens}
                      </div>
                      <div>
                        <strong>Temperature:</strong> {setupData.temperature}
                      </div>
                    </TabsContent>

                    <TabsContent value="keys" className="space-y-2 pt-4">
                      <div>
                        <strong>Telnyx API Key:</strong> {setupData.telnyxApiKey ? "✓ Configured" : "❌ Missing"}
                      </div>
                      <div>
                        <strong>Telnyx Webhook Secret:</strong>{" "}
                        {setupData.telnyxWebhookSecret ? "✓ Configured" : "Not set"}
                      </div>
                      <div>
                        <strong>
                          {setupData.aiProvider === "gemini" ? "Gemini API Key:" : "OpenAI API Key:"}
                        </strong>{" "}
                        {setupData.geminiApiKey ? "✓ Configured" : "❌ Missing"}
                      </div>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-2 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={setupData.enableSpamDetection ? "default" : "secondary"}>
                          Spam Detection: {setupData.enableSpamDetection ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant={setupData.enableCallRecording ? "default" : "secondary"}>
                          Call Recording: {setupData.enableCallRecording ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant={setupData.enableTranscription ? "default" : "secondary"}>
                          Transcription: {setupData.enableTranscription ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant={setupData.enableNotifications ? "default" : "secondary"}>
                          Notifications: {setupData.enableNotifications ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Setting up..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
