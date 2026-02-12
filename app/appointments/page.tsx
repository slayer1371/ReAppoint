"use client"

import { Appointment } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AppointmentWithRelations extends Appointment {
    business: { businessName: string; businessType: string }
    service: { name: string; durationMins: number; basePrice: number }
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const { data: session } = useSession();

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true)
            setError(null)
            
            try {
                const res = await fetch("/api/appointment-data")
                if (!res.ok) {
                    throw new Error("Failed to fetch appointments")
                }
                const data = await res.json()
                setAppointments(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred while fetching appointments.")
            } finally {
                setLoading(false)
            }
        }

        fetchAppointments();
    }, [session])

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case "LOW":
                return "bg-green-100 text-green-800"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800"
            case "HIGH":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-blue-100 text-blue-800"
            case "cancelled":
                return "bg-red-100 text-red-800"
            case "no_show":
                return "bg-orange-100 text-orange-800"
            case "completed":
                return "bg-green-100 text-green-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <p className="text-gray-600">Loading appointments...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <p className="text-red-800">Error: {error}</p>
                    </Card>
                </div>
            </div>
        )
    }

    if (appointments.length === 0) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">My Appointments</h1>
                            <p className="text-gray-600 mt-2">No appointments yet</p>
                        </div>
                        <Button onClick={() => router.push("/appointments/create-appointment")}>
                            + Book Appointment
                        </Button>
                    </div>
                    <Card className="p-6">
                        <p className="text-gray-600 mb-4">You don&apos;t have any appointments yet.</p>
                        <Button onClick={() => router.push("/appointments/create-appointment")}>
                            Book Your First Appointment
                        </Button>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">My Appointments</h1>
                        <p className="text-gray-600 mt-2">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Button onClick={() => router.push("/appointments/create-appointment")}>
                        + Book Appointment
                    </Button>
                </div>

                <div className="grid gap-4">
                    {appointments.map((appointment) => (
                        <Card 
                            key={appointment.id} 
                            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => router.push(`/appointments/${appointment.id}`)}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Business & Service */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Business</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">{appointment.business.businessName}</p>
                                    <p className="text-sm text-gray-600">{appointment.service.name}</p>
                                </div>

                                {/* Date & Time */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date & Time</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">
                                        {new Date(appointment.datetime).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Price & Duration */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Details</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">${appointment.price}</p>
                                    <p className="text-sm text-gray-600">{appointment.service.durationMins} minutes</p>
                                </div>

                                {/* Status & Risk */}
                                <div className="flex flex-col justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                        <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>
                                            {appointment.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Risk Level</p>
                                        <Badge className={`mt-1 ${getRiskColor(appointment.riskLevel)}`}>
                                            {appointment.riskLevel}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}