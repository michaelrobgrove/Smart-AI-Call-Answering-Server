"use client"

import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIAgentTester } from "@/components/ai-agent-tester"
import { TelnyxStatus } from "@/components/telnyx-status"

export default function SettingsPage() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <Tabs defaultValue="ai-tester" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai-tester">AI Agent Tester</TabsTrigger>
          <TabsTrigger value="telephony">Telephony Status</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-tester">
          <AIAgentTester />
        </TabsContent>

        <TabsContent value="telephony">
          <TelnyxStatus />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
