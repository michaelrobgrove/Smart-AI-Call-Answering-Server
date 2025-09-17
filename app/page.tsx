"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { LoginForm } from "@/components/login-form"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function HomePage() {
  const [setupStatus, setSetupStatus] = useState<"checking" | "needed" | "complete">("checking")
  const { isAuthenticated, loading, error } = useAuth()

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch("/api/setup/status")
        const data = await response.json()

        if (!data.isSetup) {
          setSetupStatus("needed")
          // Redirect to setup page
          window.location.href = "/setup"
          return
        }

        setSetupStatus("complete")
      } catch (error) {
        console.error("Failed to check setup status:", error)
        setSetupStatus("needed")
        window.location.href = "/setup"
      }
    }

    checkSetup()
  }, [])

  if (setupStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  if (setupStatus === "needed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-4">Redirecting to setup wizard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">System Error</h1>
          <p className="text-gray-600 mb-4">Please ensure the database is initialized by running the setup scripts.</p>
          <pre className="bg-gray-100 p-4 rounded text-sm text-left">npm run setup</pre>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Phone Agent...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <DashboardLayout>
      <div className="mt-8">{/* Additional dashboard content can go here */}</div>
    </DashboardLayout>
  )
}
