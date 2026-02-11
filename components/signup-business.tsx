"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

    // const { email, password, name, role = "client", businessName, businessType, phone } = body

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string
    const phone = formData.get("phone") as string
    const businessName = formData.get("business-name") as string
    const businessType = formData.get("business-type") as string
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, phone, businessName, businessType, role: "business" }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError(errorText || "An error occurred during registration")
        setIsLoading(false)
        return
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (signInResult?.error) {
        setError("Registration succeeded but automatic login failed.")
        setIsLoading(false)
      } else {
        router.push(`/verify?email=${encodeURIComponent(email)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsLoading(false)
    }
  }
  return (
    <Card {...props} className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Create your business account</CardTitle>
        <CardDescription className="text-xs">
          Manage appointments, reduce no-shows, and optimize your business with AI insights
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={onSubmit}>
          <FieldGroup>
            {error && (
              <div className="p-2 mb-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  disabled={isLoading}
                  className="h-8 text-sm"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isLoading}
                  className="h-8 text-sm"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" name="password" type="password" required disabled={isLoading} className="h-8 text-sm" />
                <FieldDescription className="text-xs">
                  Min 8 characters
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm
                </FieldLabel>
                <Input 
                id="confirm-password" 
                name="confirm-password" 
                type="password" 
                required 
                disabled={isLoading}
                className="h-8 text-sm"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Field>
                <FieldLabel htmlFor="business-name">Business Name</FieldLabel>
                <Input 
                id="business-name" 
                name="business-name" 
                type="text"
                placeholder="Acme Corp"
                required 
                disabled={isLoading}
                className="h-8 text-sm"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="business-type">Business Type</FieldLabel>
                <Input 
                id="business-type" 
                name="business-type" 
                type="text"
                placeholder="Salon, Spa, Wellness..."
                required 
                disabled={isLoading}
                className="h-8 text-sm"
                />
              </Field>
            </div>
            <Field className="mb-3">
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input 
              id="phone" 
              name="phone" 
              type="text" 
              placeholder="(123) 456-7890"
              required 
              disabled={isLoading}
              className="h-8 text-sm"
              />
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>                
                <FieldDescription className="px-2 text-center text-xs">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </FieldDescription>
                <FieldDescription className="px-2 text-center text-xs">
                  Want to sign up as a client instead? <Link href="/signup/client" className="text-primary hover:underline">Create client account</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
