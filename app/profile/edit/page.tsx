"use client"

import { ProfileResponse } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditProfilePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Client form state
    const [clientPhone, setClientPhone] = useState("");

    // Business form state
    const [businessName, setBusinessName] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");

    useEffect(() => {
        if (!session?.user) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) {
                    setError("Failed to fetch profile");
                    return;
                }
                const data = await res.json();
                setProfile(data);

                // Populate form fields
                if (data.role === "client") {
                    setClientPhone(data.data.phone || "");
                } else if (data.role === "business") {
                    setBusinessName(data.data.businessName || "");
                    setBusinessType(data.data.businessType || "");
                    setBusinessPhone(data.data.phone || "");
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setLoading(false);
            }
        };

        fetchProfile();
    }, [session]);

    const handleClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: clientPhone })
            });

            if (!res.ok) {
                setError("Failed to update profile");
                setSaving(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push("/profile"), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setSaving(false);
        }
    };

    const handleBusinessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessName,
                    businessType,
                    phone: businessPhone
                })
            });

            if (!res.ok) {
                setError("Failed to update profile");
                setSaving(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push("/profile"), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="p-6">
                        <p className="text-gray-600">No profile found.</p>
                        <Button className="mt-4" onClick={() => router.push("/profile")}>
                            Back to Profile
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Edit Profile</h1>
                    <p className="text-gray-600 mt-2">
                        {profile.role === "client" ? "Update your personal information" : "Update your business information"}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <Card className="border-red-200 bg-red-50 p-4">
                        <p className="text-red-800">{error}</p>
                    </Card>
                )}

                {/* Success Message */}
                {success && (
                    <Card className="border-green-200 bg-green-50 p-4">
                        <p className="text-green-800">Profile updated successfully! Redirecting...</p>
                    </Card>
                )}

                {/* Client Edit Form */}
                {profile.role === "client" && (
                    <Card className="p-6">
                        <form onSubmit={handleClientSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={session?.user?.name || ""}
                                    disabled
                                    className="mt-2 bg-gray-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={session?.user?.email || ""}
                                    disabled
                                    className="mt-2 bg-gray-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/profile")}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Business Edit Form */}
                {profile.role === "business" && (
                    <Card className="p-6">
                        <form onSubmit={handleBusinessSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    type="text"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="Enter your business name"
                                    className="mt-2"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="businessType">Business Type</Label>
                                <select
                                    id="businessType"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select a business type</option>
                                    <option value="salon">Salon</option>
                                    <option value="clinic">Clinic</option>
                                    <option value="gym">Gym</option>
                                    <option value="tutoring">Tutoring</option>
                                    <option value="consulting">Consulting</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="businessPhone">Phone Number</Label>
                                <Input
                                    id="businessPhone"
                                    type="tel"
                                    value={businessPhone}
                                    onChange={(e) => setBusinessPhone(e.target.value)}
                                    placeholder="Enter your business phone number"
                                    className="mt-2"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="ownerName">Owner Name</Label>
                                <Input
                                    id="ownerName"
                                    type="text"
                                    value={session?.user?.name || ""}
                                    disabled
                                    className="mt-2 bg-gray-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/profile")}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
