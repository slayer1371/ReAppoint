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
import { Loader2, Github } from "lucide-react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuthSignIn(provider: "github" | "google") {
    setIsOAuthLoading(true)
    await signIn(provider, { redirect: true, callbackUrl: "/" })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string
    
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
        body: JSON.stringify({ name, email, password }),
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Create your client account</CardTitle>
        <CardDescription className="text-xs">
          Book appointments and manage your reservations with your favorite businesses
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
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="h-8"
                disabled={isOAuthLoading || isLoading}
                onClick={() => handleOAuthSignIn("github")}
              >
                <Github className="mr-1 h-3 w-3" />
                <span className="text-xs">GitHub</span>
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="h-8"
                disabled={isOAuthLoading || isLoading}
                onClick={() => handleOAuthSignIn("google")}
              >
                <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-xs hidden sm:inline">Google</span>
              </Button>
            </div>
            <Field className="relative mb-3">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-muted-foreground">Or email</span>
              </div>
            </Field>
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
                  Want to sign up as a business? <Link href="/signup/business" className="text-primary hover:underline">Create business account</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
