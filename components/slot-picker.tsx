"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface TimeSlot {
    time: string
    available: boolean
}

interface SlotPickerProps {
    businessId: string
    selectedDate: string
    serviceId?: string
    onSelectTime: (time: string) => void
    onNoSlots?: (hasNoSlots: boolean) => void
    selectedTime?: string
    disabled?: boolean
}

export function SlotPicker({ 
    businessId, 
    selectedDate,
    serviceId,
    onSelectTime,
    onNoSlots,
    selectedTime,
    disabled = false
}: SlotPickerProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!businessId || !selectedDate) {
            setSlots([])
            return
        }

        const fetchSlots = async () => {
            setLoading(true)
            setError(null)

            try {
                const url = new URL(`/api/businesses/${businessId}/available-slots`, window.location.origin)
                url.searchParams.append("date", selectedDate)
                if (serviceId) {
                    url.searchParams.append("serviceId", serviceId)
                }
                
                const res = await fetch(url.toString())
                if (!res.ok) throw new Error("Failed to fetch available slots")
                const data = await res.json()
                setSlots(data.slots || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load time slots")
            } finally {
                setLoading(false)
            }
        }

        fetchSlots()
    }, [businessId, selectedDate, serviceId])

    // Notify parent when there are no available slots
    useEffect(() => {
        if (!loading && slots.length > 0) {
            const availableCount = slots.filter(s => s.available).length
            onNoSlots?.(availableCount === 0)
        }
    }, [slots, loading, onNoSlots])

    if (!selectedDate) {
        return (
            <div className="text-sm text-gray-500 p-4">
                Select a date to view available times
            </div>
        )
    }

    if (loading) {
        return (
            <div className="text-sm text-gray-600 p-4">
                Loading available times...
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
            </Card>
        )
    }

    const availableCount = slots.filter(s => s.available).length

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                    Available Times ({availableCount} slots)
                </p>
                <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                        <span className="text-gray-600">Booked</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
                {slots.map((slot) => (
                    <button
                        type="button"
                        key={slot.time}
                        onClick={() => slot.available && onSelectTime(slot.time)}
                        disabled={!slot.available || disabled}
                        className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                            selectedTime === slot.time && slot.available
                                ? "bg-blue-600 text-white border-2 border-blue-600"
                                : slot.available
                                ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 cursor-pointer"
                                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                        }`}
                    >
                        {slot.time}
                    </button>
                ))}
            </div>

            {availableCount === 0 && (
                <Card className="border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                        No available slots on this date. Please select a different date.
                    </p>
                </Card>
            )}
        </div>
    )
}
