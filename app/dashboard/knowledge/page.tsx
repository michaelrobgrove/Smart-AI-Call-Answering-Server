"use client"

import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KnowledgeBaseManager } from "@/components/knowledge-base-manager"

export default function KnowledgePage() {
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
      <KnowledgeBaseManager />
    </DashboardLayout>
  )
}
