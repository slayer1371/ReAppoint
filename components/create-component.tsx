"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SlotPicker } from "@/components/slot-picker"
import { BusinessProfile, Service } from "@prisma/client"

export default function CreateAppointment() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
    const [services, setServices] = useState<Service[]>([])
    
    const [selectedBusiness, setSelectedBusiness] = useState<string>("")
    const [selectedService, setSelectedService] = useState<string>("")
    const [appointmentDate, setAppointmentDate] = useState<string>("")
    const [appointmentTime, setAppointmentTime] = useState<string>("")
    const [noAvailableSlots, setNoAvailableSlots] = useState(false)
    const [joiningWaitlist, setJoiningWaitlist] = useState(false)
    const [waitlistId, setWaitlistId] = useState<string | null>(null)
    const [fromWaitlist, setFromWaitlist] = useState(false)
    
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Fetch all businesses on mount and check for waitlist params
    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await fetch("/api/businesses")
                if (!res.ok) throw new Error("Failed to fetch businesses")
                const data = await res.json()
                setBusinesses(data)

                // Check if coming from waitlist acceptance
                const waitlistIdParam = searchParams.get("waitlistId")
                const businessIdParam = searchParams.get("businessId")
                const serviceIdParam = searchParams.get("serviceId")

                if (waitlistIdParam && businessIdParam && serviceIdParam) {
                    console.log("Loaded from waitlist offer:", { waitlistIdParam, businessIdParam, serviceIdParam })
                    setWaitlistId(waitlistIdParam)
                    setSelectedBusiness(businessIdParam)
                    setSelectedService(serviceIdParam)
                    setFromWaitlist(true)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load businesses")
            } finally {
                setLoading(false)
            }
        }

        fetchBusinesses()
    }, [searchParams])

    // Fetch services when business is selected
    useEffect(() => {
        if (!selectedBusiness) {
            setServices([])
            setSelectedService("")
            return
        }

        const fetchServices = async () => {
            try {
                const res = await fetch(`/api/businesses/${selectedBusiness}/services`)
                if (!res.ok) throw new Error("Failed to fetch services")
                const data = await res.json()
                setServices(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load services")
            }
        }

        fetchServices()
    }, [selectedBusiness])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        if (!selectedBusiness || !selectedService || !appointmentDate || !appointmentTime) {
            setError("Please fill in all fields")
            setSubmitting(false)
            return
        }

        try {
            const datetime = new Date(`${appointmentDate}T${appointmentTime}`)
            const now = new Date()

            if (datetime < now) {
                setError("Appointment time must be in the future")
                setSubmitting(false)
                return
            }

            const res = await fetch("/api/appointment-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: selectedBusiness,
                    serviceId: selectedService,
                    datetime: datetime.toISOString(),
                    ...(waitlistId && { waitlistId })  // Include waitlistId if present
                })
            })

            if (!res.ok) {
                const data = await res.json()
                console.error("Appointment creation failed:", { status: res.status, error: data.error })
                throw new Error(data.error || "Failed to create appointment")
            }

            const appointmentData = await res.json()
            console.log("Appointment created successfully:", appointmentData)
            
            if (fromWaitlist) {
                console.log("Waitlist entry should be removed, appointment created from waitlist")
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/appointments")
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create appointment")
        } finally {
            setSubmitting(false)
        }
    }

    const handleJoinWaitlist = async () => {
        if (!selectedBusiness || !selectedService) {
            setError("Please select business and service")
            return
        }

        setJoiningWaitlist(true)
        setError(null)

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: selectedBusiness,
                    serviceId: selectedService
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to join waitlist")
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/waitlist")
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to join waitlist")
        } finally {
            setJoiningWaitlist(false)
        }
    }

    const selectedServiceData = services.find(s => s.id === selectedService)
    const minDate = new Date().toISOString().split('T')[0]

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {fromWaitlist && (
                    <Card className="border-green-200 bg-green-50 p-4">
                        <p className="text-green-800 font-semibold">
                            🎉 Your waitlist offer has been accepted! Now complete your booking below.
                        </p>
                    </Card>
                )}

                <div>
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-6"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-4xl font-bold text-gray-900">
                        {fromWaitlist ? "Complete Your Booking" : "Book an Appointment"}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {fromWaitlist 
                            ? "A slot has opened up! Select your preferred date and time."
                            : "Select a business, service, and time"}
                    </p>
                </div>

                {success && (
                    <Card className="border-green-200 bg-green-50 p-6">
                        <p className="text-green-800 font-semibold">✓ Appointment created successfully! Redirecting...</p>
                    </Card>
                )}

                {error && (
                    <Card className="border-red-200 bg-red-50 p-6">
                        <p className="text-red-800">{error}</p>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6">
                        {/* Select Business */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Business *
                            </label>
                            {fromWaitlist ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                    <p className="text-gray-900">
                                        {businesses.find(b => b.id === selectedBusiness)?.businessName || "Loading..."}
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={selectedBusiness}
                                    onChange={(e) => setSelectedBusiness(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                >
                                    <option value="">Select a business</option>
                                    {businesses.map((business) => (
                                        <option key={business.id} value={business.id}>
                                            {business.businessName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Select Service */}
                        {selectedBusiness && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Service *
                                </label>
                                {fromWaitlist ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                        <p className="text-gray-900">
                                            {services.find(s => s.id === selectedService)?.name || "Loading..."} (${services.find(s => s.id === selectedService)?.basePrice.toFixed(2) || "0.00"})
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={submitting}
                                    >
                                        <option value="">Select a service</option>
                                        {services.map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} (${service.basePrice.toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Service Info */}
                        {selectedServiceData && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Duration:</span> {selectedServiceData.durationMins} minutes
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-semibold">Price:</span> ${selectedServiceData.basePrice.toFixed(2)}
                                </p>
                            </div>
                        )}

                        {/* Date Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Date *
                            </label>
                            <Input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                min={minDate}
                                disabled={submitting}
                                className="w-full"
                            />
                        </div>

                        {/* Time Slots */}
                        {appointmentDate && selectedBusiness && (
                            <div className="mb-6">
                                <SlotPicker
                                    businessId={selectedBusiness}
                                    selectedDate={appointmentDate}
                                    serviceId={selectedService}
                                    onSelectTime={setAppointmentTime}
                                    onNoSlots={setNoAvailableSlots}
                                    selectedTime={appointmentTime}
                                    disabled={submitting}
                                />
                                
                                {/* Join Waitlist Option */}
                                {noAvailableSlots && (
                                    <Card className="border-blue-200 bg-blue-50 p-4 mt-4">
                                        <p className="text-sm text-blue-800 mb-3">
                                            All slots are booked for this date. Join the waitlist to get notified when a slot becomes available!
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={handleJoinWaitlist}
                                            disabled={joiningWaitlist || !selectedBusiness || !selectedService}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            {joiningWaitlist ? "Joining..." : "Join Waitlist"}
                                        </Button>
                                    </Card>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Summary */}
                    {selectedBusiness && selectedService && appointmentDate && appointmentTime && (
                        <Card className="p-6 bg-slate-50">
                            <h3 className="font-semibold text-gray-900 mb-3">Appointment Summary</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-semibold">Business:</span>{" "}
                                    {businesses.find(b => b.id === selectedBusiness)?.businessName}
                                </p>
                                <p>
                                    <span className="font-semibold">Service:</span> {selectedServiceData?.name}
                                </p>
                                <p>
                                    <span className="font-semibold">Duration:</span> {selectedServiceData?.durationMins} minutes
                                </p>
                                <p>
                                    <span className="font-semibold">Date & Time:</span>{" "}
                                    {new Date(`${appointmentDate}T${appointmentTime}`).toLocaleString()}
                                </p>
                                <p>
                                    <span className="font-semibold">Price:</span> ${selectedServiceData?.basePrice.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || !selectedBusiness || !selectedService || !appointmentDate || !appointmentTime}
                            className="flex-1"
                        >
                            {submitting ? "Creating..." : "Create Appointment"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
