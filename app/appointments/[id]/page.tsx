"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SlotPicker } from "@/components/slot-picker"
import { Appointment, BusinessProfile, Service, ClientProfile } from "@prisma/client"

interface AppointmentDetail extends Appointment {
    business: BusinessProfile
    service: Service
    client: ClientProfile
    lastMinuteSlot: { discountedPrice: number; expiresAt: string } | null
}

export default function AppointmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    
    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRescheduling, setIsRescheduling] = useState(false)
    const [rescheduleDate, setRescheduleDate] = useState<string>("")
    const [rescheduleTime, setRescheduleTime] = useState<string>("")
    const [isCancelling, setIsCancelling] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string>("")

    useEffect(() => {
        if (!params.id) return

        const fetchAppointment = async () => {
            try {
                const res = await fetch(`/api/appointment-data/${params.id}`)
                if (!res.ok) {
                    throw new Error("Failed to fetch appointment details")
                }
                const data = await res.json()
                setAppointment(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchAppointment()
    }, [params.id])

    const handleReschedule = async () => {
        if (!rescheduleDate || !rescheduleTime || !appointment) {
            setError("Please select a new date and time")
            return
        }

        setError(null)

        try {
            const datetime = new Date(`${rescheduleDate}T${rescheduleTime}`)
            const res = await fetch(`/api/appointment-data/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ datetime: datetime.toISOString() })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to reschedule appointment")
            }

            const updatedAppointment = await res.json()
            setAppointment(updatedAppointment)
            setIsRescheduling(false)
            setRescheduleDate("")
            setRescheduleTime("")
            setSuccessMessage("Appointment rescheduled successfully!")
            setTimeout(() => setSuccessMessage(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reschedule appointment")
        }
    }

    const handleCancel = async () => {
        if (!appointment) return

        if (!confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) {
            return
        }

        setError(null)
        setIsCancelling(true)

        try {
            const res = await fetch(`/api/appointment-data/${params.id}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to cancel appointment")
            }

            setSuccessMessage("Appointment cancelled successfully!")
            setTimeout(() => {
                router.push("/appointments")
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel appointment")
            setIsCancelling(false)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-600">Loading appointment details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto overflow-x-auto">
                    <Button 
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-6"
                    >
                        ← Back
                    </Button>
                    <Card className="border-red-200 bg-red-50 p-6">
                        <p className="text-red-800">Error: {error}</p>
                    </Card>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <Button 
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-6"
                    >
                        ← Back
                    </Button>
                    <Card className="p-6">
                        <p className="text-gray-600">Appointment not found.</p>
                    </Card>
                </div>
            </div>
        )
    }

    const appointmentDate = new Date(appointment.datetime)
    const bookingDate = new Date(appointment.createdAt)

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <Button 
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-6"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-4xl font-bold text-gray-900">Appointment Details</h1>
                    <p className="text-gray-600 mt-2">ID: {appointment.id}</p>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50 p-6">
                        <p className="text-red-800">{error}</p>
                    </Card>
                )}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business & Service</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Business Name</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{appointment.business.businessName}</p>
                            <p className="text-sm text-gray-600 mt-1 capitalize">{appointment.business.businessType}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Service</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{appointment.service.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{appointment.service.durationMins} minutes</p>
                        </div>
                    </div>
                </Card>

                {/* Date & Time */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Date & Time</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Appointment Date</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                {appointmentDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Appointment Time</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                                {appointmentDate.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Booking Date</p>
                            <p className="text-sm text-gray-600 mt-1">
                                {bookingDate.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Booked In Advance</p>
                            <p className="text-sm text-gray-600 mt-1">{appointment.bookingWindowDays} days</p>
                        </div>
                    </div>
                </Card>

                {/* Pricing */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pricing</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Base Price</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">${appointment.price.toFixed(2)}</p>
                        </div>
                        {appointment.lastMinuteSlot && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Minute Discount</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">${appointment.lastMinuteSlot.discountedPrice.toFixed(2)}</p>
                                <p className="text-xs text-gray-600 mt-1">Expires: {new Date(appointment.lastMinuteSlot.expiresAt).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Status & Risk */}
                <Card className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Status & Risk Assessment</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                            <Badge className={`${getStatusColor(appointment.status)}`}>
                                {appointment.status.replace('_', ' ').toLowerCase()}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Risk Level</p>
                            <Badge className={`${getRiskColor(appointment.riskLevel)}`}>
                                {appointment.riskLevel}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">AI Risk Score</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">{appointment.aiRiskScore}</span>
                                <span className="text-xs text-gray-600">/100</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Client Type</p>
                            <Badge className="bg-blue-100 text-blue-800">
                                {appointment.isReturningClient ? 'Returning' : 'New'}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Confirmation Status */}
                {appointment.pollSentAt && (
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Confirmation</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Confirmation Poll Sent</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {new Date(appointment.pollSentAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Client Response</p>
                                <p className="text-sm text-gray-900 mt-1 capitalize">
                                    {appointment.pollResponse ? appointment.pollResponse.replace('_', ' ') : 'Pending'}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Actions */}
                {successMessage && (
                    <Card className="border-green-200 bg-green-50 p-6">
                        <p className="text-green-800 font-semibold">✓ {successMessage}</p>
                    </Card>
                )}

                {!isRescheduling && appointment?.status === "confirmed" && (
                    <div className="flex gap-4">
                        <Button onClick={() => setIsRescheduling(true)}>
                            Reschedule
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Appointment"}
                        </Button>
                    </div>
                )}

                {isRescheduling && appointment?.status === "confirmed" && (
                    <Card className="p-6 bg-blue-50">
                        <h3 className="font-semibold text-gray-900 mb-4">Reschedule Appointment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    New Date *
                                </label>
                                <Input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => {
                                        setRescheduleDate(e.target.value)
                                        setRescheduleTime("")
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full"
                                />
                            </div>

                            {rescheduleDate && appointment && (
                                <div>
                                    <SlotPicker
                                        businessId={appointment.businessId}
                                        selectedDate={rescheduleDate}
                                        serviceId={appointment.serviceId}
                                        onSelectTime={setRescheduleTime}
                                        selectedTime={rescheduleTime}
                                        disabled={false}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={handleReschedule}
                                    disabled={!rescheduleDate || !rescheduleTime}
                                >
                                    Confirm Reschedule
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsRescheduling(false)
                                        setRescheduleDate("")
                                        setRescheduleTime("")
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {appointment && (appointment.status === "cancelled" || appointment.status === "completed" || appointment.status === "no_show") && (
                    <Card className="p-6 bg-gray-50">
                        <p className="text-gray-700">
                            This appointment is {appointment.status} and cannot be modified.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    )
}
