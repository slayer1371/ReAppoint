"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface Appointment {
  id: string
  datetime: string
  status: string
  price: number
  durationMins: number
  aiRiskScore: number
  client: {
    user?: {
      name: string
      email: string
    }
  }
  service: {
    name: string
  }
}

export default function BusinessAppointmentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user || session.user.role !== "business") {
      router.push("/login")
      return
    }

    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/business/appointments")
        if (!res.ok) throw new Error("Failed to fetch appointments")
        const data = await res.json()
        setAppointments(data)
        setFilteredAppointments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [session, router])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredAppointments(appointments)
    } else {
      setFilteredAppointments(appointments.filter(a => a.status === statusFilter))
    }
  }, [statusFilter, appointments])

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    setUpdatingId(appointmentId)
    try {
      const res = await fetch(`/api/business/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error("Failed to update appointment")

      const updated = await res.json()
      setAppointments(
        appointments.map(a => (a.id === appointmentId ? updated : a))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600"
    if (score >= 40) return "text-yellow-600"
    return "text-green-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            onClick={() => router.push("/business/dashboard")}
            variant="outline"
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all your appointments
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Filter */}
        <Card className="p-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "confirmed", "completed", "cancelled", "no_show"].map(
              (status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? "default" : "outline"}
                  className={
                    statusFilter === status ? "bg-blue-600" : ""
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("_", "-")}
                </Button>
              )
            )}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
          </p>
        </Card>

        {/* Appointments List */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-600">No appointments found</p>
            </Card>
          ) : (
            filteredAppointments.map((apt) => (
              <Card key={apt.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg text-gray-900">
                        {new Date(apt.datetime).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}{" "}
                        at{" "}
                        {new Date(apt.datetime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(apt.status)}`}
                      >
                        {apt.status.replace("_", "-")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {apt.client.user?.name || "Unknown Client"} •{" "}
                      {apt.service.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {apt.durationMins} mins • ${apt.price.toFixed(2)}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${getRiskColor(apt.aiRiskScore)}`}>
                      Risk Score: {apt.aiRiskScore}/100
                    </p>
                  </div>

                  {/* Actions */}
                  {apt.status === "confirmed" && (
                    <div className="flex gap-2">
                      <Button
                        disabled={updatingId === apt.id}
                        onClick={() => handleStatusChange(apt.id, "completed")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        Mark Complete
                      </Button>
                      <Button
                        disabled={updatingId === apt.id}
                        onClick={() => handleStatusChange(apt.id, "no_show")}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <XCircle size={16} className="mr-2" />
                        No-show
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
