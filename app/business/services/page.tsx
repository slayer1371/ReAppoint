"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Plus } from "lucide-react"

interface Service {
  id: string
  name: string
  durationMins: number
  basePrice: number
  noShowRiskMult: number
}

export default function ServicesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    durationMins: "60",
    basePrice: "0",
    noShowRiskMult: "1.0"
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user || session.user.role !== "business") {
      router.push("/login")
      return
    }

    fetchServices()
  }, [session, router])

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/business/services")
      if (!res.ok) throw new Error("Failed to fetch services")
      const data = await res.json()
      setServices(data)
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

    try {
      if (editingId) {
        const res = await fetch(`/api/business/services/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error("Failed to update service")
        const updated = await res.json()
        setServices(services.map(s => (s.id === editingId ? updated : s)))
      } else {
        const res = await fetch("/api/business/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create service")
        }
        const created = await res.json()
        setServices([...services, created])
      }

      setFormData({
        name: "",
        durationMins: "60",
        basePrice: "0",
        noShowRiskMult: "1.0"
      })
      setIsCreating(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const res = await fetch(`/api/business/services/${id}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete service")
      }
      setServices(services.filter(s => s.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete service")
    }
  }

  const startEdit = (service: Service) => {
    setEditingId(service.id)
    setFormData({
      name: service.name,
      durationMins: service.durationMins.toString(),
      basePrice: service.basePrice.toString(),
      noShowRiskMult: service.noShowRiskMult.toString()
    })
    setIsCreating(true)
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      name: "",
      durationMins: "60",
      basePrice: "0",
      noShowRiskMult: "1.0"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-gray-600">Loading services...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            onClick={() => router.push("/business/dashboard")}
            variant="outline"
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-2">Create and manage your services</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Service" : "Create New Service"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Service Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Haircut, Facial, Massage"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    value={formData.durationMins}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMins: e.target.value })
                    }
                    min="15"
                    max="480"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price ($) *
                  </label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  No-show Risk Multiplier
                </label>
                <Input
                  type="number"
                  value={formData.noShowRiskMult}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      noShowRiskMult: e.target.value
                    })
                  }
                  step="0.1"
                  min="0.1"
                  max="3"
                />
                <p className="text-xs text-gray-600 mt-1">
                  How much riskier is this service for no-shows? (1.0 = normal)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  onClick={cancelEdit}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Services List */}
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            <Plus size={20} className="mr-2" />
            Add New Service
          </Button>
        )}

        <div className="space-y-3">
          {services.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-600">
                No services yet. Create one to get started!
              </p>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {service.name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-semibold text-gray-900">
                          {service.durationMins} mins
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold text-gray-900">
                          ${service.basePrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Risk Multiplier</p>
                        <p className="font-semibold text-gray-900">
                          {service.noShowRiskMult}x
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEdit(service)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
