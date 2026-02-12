"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, TrendingUp, AlertCircle } from "lucide-react"

interface DashboardData {
  businessProfile: any
  stats: {
    thisMonth: {
      totalAppointments: number
      completed: number
      cancelled: number
      noShow: number
      confirmed: number
      totalRevenue: number
    }
    servicesCount: number
    waitlistCount: number
  }
  todayAppointments: any[]
  appointmentsThisMonth: number
}

export default function BusinessDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user || session.user.role !== "business") {
      router.push("/login")
      return
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/business/dashboard")
        if (!res.ok) throw new Error("Failed to fetch dashboard")
        const data = await res.json()
        setDashboard(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <Card className="border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{error || "Failed to load dashboard"}</p>
        </Card>
      </div>
    )
  }

  const stats = dashboard.stats.thisMonth

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            {dashboard.businessProfile.businessName}
          </h1>
          <p className="text-gray-600 mt-2">Business Dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => router.push("/business/appointments")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📅 Manage Appointments
          </Button>
          <Button
            onClick={() => router.push("/business/services")}
            className="bg-green-600 hover:bg-green-700"
          >
            ⚙️ Services
          </Button>
          <Button
            onClick={() => router.push("/business/settings")}
            variant="outline"
          >
            ⚙️ Settings
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalAppointments}
                </p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.completed}
                </p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Issues</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.noShow + stats.cancelled}
                </p>
              </div>
              <AlertCircle className="text-orange-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            This Month's Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalAppointments}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.cancelled}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">No-shows</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.noShow}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.confirmed}
              </p>
            </div>
          </div>
        </Card>

        {/* Waitlist & Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Waitlist
            </h2>
            <p className="text-4xl font-bold text-blue-600">
              {dashboard.stats.waitlistCount}
            </p>
            <p className="text-sm text-gray-600 mt-2">people waiting</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => router.push("/business/waitlist")}
            >
              View Waitlist
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Services
            </h2>
            <p className="text-4xl font-bold text-green-600">
              {dashboard.stats.servicesCount}
            </p>
            <p className="text-sm text-gray-600 mt-2">active services</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => router.push("/business/services")}
            >
              Manage Services
            </Button>
          </Card>
        </div>

        {/* Today's Appointments */}
        {dashboard.todayAppointments.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Today's Appointments
            </h2>
            <div className="space-y-3">
              {dashboard.todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(apt.datetime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {apt.client.user?.name || "Client"} - {apt.service.name}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      apt.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
