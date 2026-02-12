"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users } from "lucide-react"

interface WaitlistEntry {
  id: string
  position: number
  status: string
  createdAt: string
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

export default function BusinessWaitlistPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user || session.user.role !== "business") {
      router.push("/login")
      return
    }

    fetchWaitlist()
  }, [session, router])

  const fetchWaitlist = async () => {
    try {
      const res = await fetch("/api/business/waitlist")
      if (!res.ok) throw new Error("Failed to fetch waitlist")
      const data = await res.json()
      setWaitlist(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-blue-100 text-blue-800"
      case "offered":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-gray-600">Loading waitlist...</p>
      </div>
    )
  }

  const waitingCount = waitlist.filter(w => w.status === "waiting").length
  const offeredCount = waitlist.filter(w => w.status === "offered").length

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
          <h1 className="text-4xl font-bold text-gray-900">Waitlist</h1>
          <p className="text-gray-600 mt-2">Monitor your service waitlists</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {waitlist.length}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {waitingCount}
                </p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offered</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {offeredCount}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Waitlist Entries */}
        {waitlist.length === 0 ? (
          <Card className="p-6">
            <p className="text-gray-600">No one on the waitlist yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {waitlist.map((entry) => (
              <Card key={entry.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-3xl font-bold text-gray-400">
                        #{entry.position}
                      </span>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {entry.client.user?.name || "Unknown Client"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {entry.service.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Joined: {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(entry.status)}`}
                  >
                    {entry.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 About Waitlist</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              • When an appointment is cancelled, the #1 waiting customer is automatically offered a slot
            </li>
            <li>• Customers have 24 hours to accept or decline the offer</li>
            <li>• If they decline, the offer goes to the next person in line</li>
            <li>• Waiting customers are notified when they reach #1</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
