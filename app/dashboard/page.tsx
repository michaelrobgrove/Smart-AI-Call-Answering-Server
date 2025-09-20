// app/dashboard/page.tsx

import { redirect } from "next/navigation"

export default function DashboardPage() {
  // Redirect to the first available dashboard section
  redirect("/dashboard/calls")
}
