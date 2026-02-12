"use client"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function AppointmentConfirmed() {
  const searchParams = useSearchParams()
  const fromWaitlist = searchParams.get("from") === "waitlist"

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {fromWaitlist ? "Slot Claimed!" : "Appointment Confirmed!"}
          </h1>

          <p className="text-gray-600">
            {fromWaitlist
              ? "Your waitlist offer has been claimed. Check your email for appointment details."
              : "Thank you for confirming your appointment. See you soon!"}
          </p>

          <div className="pt-6 space-y-2">
            <Link href="/appointments">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View My Appointments
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 pt-4">
            Check your email for a confirmation with all the details.
          </p>
        </div>
      </Card>
    </div>
  )
}
