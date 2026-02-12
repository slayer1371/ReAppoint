"use client"

import { ProfileResponse } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true);
    const {data : session} = useSession();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);

    useEffect(() => {
        if(!session?.user) return 

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!res.ok) {
                    setError("Failed to fetch profile")
                    return
                }
                const data = await res.json();
                setProfile(data)
                setLoading(false)
            } catch (err) {
                console.error("Error fetching profile:", err)
                setError(err instanceof Error ? err.message : "Unknown error")
                setLoading(false)
            }
        }
        fetchProfile();
    }, [session])
    
    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-red-200 bg-red-50 p-6">
                        <p className="text-red-800">Error: {error}</p>
                    </Card>
                </div>
            </div>
        )
    }

    if (!profile || !profile.data) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                    <Card className="border-yellow-200 bg-yellow-50 p-6">
                        <p className="text-yellow-800">
                            Your profile is being initialized. Please refresh the page in a moment.
                        </p>
                    </Card>
                </div>
            </div>
        )
    }

    if (profile.role === "client") {
        const client = profile.data;
        const riskColors: Record<string, string> = {
            "new": "bg-blue-100 text-blue-800",
            "reliable": "bg-green-100 text-green-800",
            "at_risk": "bg-yellow-100 text-yellow-800",
            "high_risk": "bg-red-100 text-red-800",
        };

        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-2">Client Account</p>
                    </div>

                    {/* User Info */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="text-lg text-gray-900 mt-1">{session?.user?.name || "Not set"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="text-lg text-gray-900 mt-1">{session?.user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-lg text-gray-900 mt-1">{client.phone || "Not set"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Risk Profile</p>
                                <div className="mt-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${riskColors[client.riskProfile]}`}>
                                        {client.riskProfile}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Appointment Statistics */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Appointment Statistics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{client.totalAppointments}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{client.completedAppointments}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{client.cancelCount}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">No-shows</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{client.noShowCount}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Rates */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Performance Rates</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Cancellation Rate</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-gray-900">{client.cancelRate.toFixed(1)}</p>
                                    <p className="text-gray-600">%</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">No-show Rate</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-gray-900">{client.noShowRate.toFixed(1)}</p>
                                    <p className="text-gray-600">%</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Last Appointment</p>
                                <p className="text-lg text-gray-900 mt-1">
                                    {client.lastAppointmentAt 
                                        ? new Date(client.lastAppointmentAt).toLocaleDateString() 
                                        : "No appointments yet"}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => router.push("/profile/edit")}>Edit Profile</Button>
                        <Button onClick={() => router.push("/appointments")}>View Appointments</Button>
                    </div>
                </div>
            </div>
        )
    }
  
    if (profile.role === "business") {
        const business = profile.data;

        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{business.businessName}</h1>
                        <p className="text-gray-600 mt-2 capitalize">Business Account • {business.businessType}</p>
                    </div>

                    {/* Business Information */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Business Name</p>
                                <p className="text-lg text-gray-900 mt-1">{business.businessName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Business Type</p>
                                <p className="text-lg text-gray-900 mt-1 capitalize">{business.businessType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-lg text-gray-900 mt-1">{business.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="text-lg text-gray-900 mt-1">{session?.user?.email}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Owner Information */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Owner Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Owner Name</p>
                                <p className="text-lg text-gray-900 mt-1">{session?.user?.name || "Not set"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Owner Email</p>
                                <p className="text-lg text-gray-900 mt-1">{session?.user?.email}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Risk Settings */}
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risk Management Settings</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">No-show Risk Threshold</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-gray-900">{business.noShowThreshold}</p>
                                    <p className="text-gray-600">%</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Require Deposit for High-Risk Clients</p>
                                <p className="text-lg text-gray-900 mt-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${business.requireDepositForHighRisk ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {business.requireDepositForHighRisk ? 'Enabled' : 'Disabled'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => router.push("/profile/edit")}>Edit Business Info</Button>
                        <Button onClick={() => router.push("/dashboard")}>View Dashboard</Button>
                        <Button variant="outline" onClick={() => router.push("/services")}>Manage Services</Button>
                    </div>
                </div>
            </div>
        )
    }
}