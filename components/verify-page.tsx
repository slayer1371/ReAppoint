'use client'

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Verifypagecomponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") // We'll pass the email in the URL
  const [code, setCode] = useState("")
  const [status, setStatus] = useState("")

  const handleVerify = async () => {
    if (!email) return
    
    const res = await fetch("/api/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })

    if (res.ok) {
      setStatus("Success! Redirecting...")
      setTimeout(() => router.push("/"), 2000) // Go to dashboard
    } else {
      setStatus("Invalid code. Try again.")
    }
  }

  if (!email) return <div className="p-8">Error: No email found to verify.</div>

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Verify your Email</CardTitle>
          <p className="text-sm text-gray-500">We sent a code to {email}</p>
        </CardHeader>
        {/* The master code is 111111, since I haven't bought a domain for this project. */}
        <p className="text-sm text-gray-500 px-6">The master code is 111111, since I haven&apos;t bought a domain for this project yet, and Resend doesn&apos;t support sending emails without a domain name.</p>
        
        <CardContent className="space-y-4">
          <Input 
            placeholder="Enter 6-digit code" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
          {status && <p className={`text-sm ${status.includes("Success") ? "text-green-600" : "text-red-600"}`}>{status}</p>}
          <Button onClick={handleVerify} className="w-full">Verify Me</Button>
        </CardContent>
      </Card>
    </div>
  )
}