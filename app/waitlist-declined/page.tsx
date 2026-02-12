"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function WaitlistDeclinedPage() {

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Offer Declined</h1>

          <p className="text-gray-600">
            We understand. The offer has been passed to the next person on the waitlist. You'll remain on the waitlist for future openings.
          </p>

          <div className="pt-6 space-y-2">
            <Link href="/waitlist">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View My Waitlist
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 pt-4">
            We'll email you if another slot opens up.
          </p>
        </div>
      </Card>
    </div>
  )
}
