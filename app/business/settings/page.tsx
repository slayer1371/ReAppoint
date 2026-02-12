"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Settings {
  businessName: string
  businessType: string
  phone: string
  noShowThreshold: number
  requireDepositForHighRisk: boolean
  settings: {
    businessHours: any
    holidays: any[]
    cancellationPolicy: string
    timezone: string
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    businessName: "",
    businessType: "",
    phone: "",
    noShowThreshold: 20,
    requireDepositForHighRisk: false,
    settings: {
      businessHours: {},
      holidays: [],
      cancellationPolicy: "",
      timezone: "UTC"
    }
  })

  useEffect(() => {
    if (!session?.user || session.user.role !== "business") {
      router.push("/login")
      return
    }

    fetchSettings()
  }, [session, router])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/business/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/business/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (!res.ok) throw new Error("Failed to update settings")

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            onClick={() => router.push("/business/dashboard")}
            variant="outline"
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your business settings</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50 p-6">
            <p className="text-green-800">✓ Settings updated successfully!</p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Business Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Business Name
                </label>
                <Input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessName: e.target.value
                    })
                  }
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Business Type
                </label>
                <Input
                  type="text"
                  value={settings.businessType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      businessType: e.target.value
                    })
                  }
                  placeholder="e.g., Salon, Spa, Wellness"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      phone: e.target.value
                    })
                  }
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </Card>

          {/* Risk & Policies */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Risk Management
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  No-show Threshold (%)
                </label>
                <Input
                  type="number"
                  value={settings.noShowThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      noShowThreshold: parseInt(e.target.value)
                    })
                  }
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Percentage at which a client is flagged as high-risk
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="deposit"
                  checked={settings.requireDepositForHighRisk}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      requireDepositForHighRisk: e.target.checked
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="deposit" className="text-sm font-semibold text-gray-900">
                  Require deposit for high-risk clients
                </label>
              </div>
            </div>
          </Card>

          {/* Cancellation Policy */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Policies
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  value={settings.settings.cancellationPolicy}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settings: {
                        ...settings.settings,
                        cancellationPolicy: e.target.value
                      }
                    })
                  }
                  placeholder="e.g., 24 hours notice required"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/business/dashboard")}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Additional Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Set a higher no-show threshold to flag clients more aggressively</li>
            <li>• Enable deposits for high-risk clients to reduce no-show rate</li>
            <li>• Keep your cancellation policy clear and displayed to clients</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
