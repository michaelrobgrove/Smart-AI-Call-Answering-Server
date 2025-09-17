"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Phone, Settings, LogOut, Menu, X, Activity, TrendingUp, AlertCircle, BookOpen } from "lucide-react"
import { usePathname } from "next/navigation"
import { NotificationCenter } from "@/components/notification-center"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Activity, current: pathname === "/" || pathname === "/dashboard" },
    { name: "Call Logs", href: "/dashboard/calls", icon: Phone, current: pathname === "/dashboard/calls" },
    {
      name: "Knowledge Base",
      href: "/dashboard/knowledge",
      icon: BookOpen,
      current: pathname === "/dashboard/knowledge",
    },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, current: pathname === "/dashboard/settings" },
  ]

  const stats = [
    { name: "Total Calls Today", value: "24", change: "+12%", changeType: "positive" },
    { name: "Qualified Leads", value: "8", change: "+25%", changeType: "positive" },
    { name: "Spam Blocked", value: "3", change: "-5%", changeType: "negative" },
    { name: "Avg Call Duration", value: "4:32", change: "+8%", changeType: "positive" },
  ]

  const isMainDashboard = pathname === "/" || pathname === "/dashboard"

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-sidebar">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-sidebar-foreground">AI Phone Agent</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      item.current
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-lg font-semibold text-sidebar-foreground">AI Phone Agent</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors ${
                          item.current
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-sidebar-foreground">
                  <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <span className="text-sidebar-accent-foreground text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="sr-only">Your profile</span>
                  <span>{user?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold">{navigation.find((item) => item.current)?.name || "Dashboard"}</h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                AI Agent Active
              </Badge>
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Stats overview */}
            {isMainDashboard && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat) => (
                  <Card key={stat.name}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change} from yesterday
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recent activity */}
            {isMainDashboard && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Recent Calls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { caller: "John Smith", company: "ABC Corp", time: "2 min ago", status: "qualified" },
                        { caller: "Sarah Johnson", company: "XYZ Ltd", time: "15 min ago", status: "transferred" },
                        { caller: "Unknown", company: "", time: "32 min ago", status: "spam" },
                      ].map((call, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">{call.caller}</p>
                            <p className="text-sm text-muted-foreground">{call.company || "No company"}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                call.status === "qualified"
                                  ? "default"
                                  : call.status === "transferred"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {call.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{call.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>AI Agent</span>
                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Telephony Service</span>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Database</span>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Notifications</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
