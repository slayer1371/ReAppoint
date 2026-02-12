"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GalleryVerticalEnd, Menu, X, LogOut, Settings, Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { data: session, status} = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Don't block rendering - let navbar render immediately
  // Session data will load asynchronously
  
  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const isAuthenticated = status === "authenticated"
  const isClient = session?.user?.role === "client"
  const isBusiness = session?.user?.role === "business"

  // Navigation links based on user role
  const clientLinks = [
    { href: "/appointments", label: "My Appointments" },
    { href: "/waitlist", label: "Waitlist" },
    { href: "/profile", label: "Profile" },
  ]

  const businessLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/appointments", label: "Appointments" },
    { href: "/services", label: "Services" },
    { href: "/settings", label: "Settings" },
  ]

  const navLinks = isClient ? clientLinks : isBusiness ? businessLinks : []

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span className="hidden sm:inline text-sm">Re-Appoint</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="text-sm">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="size-6 rounded-full bg-muted" />
                  <span className="text-sm">{session?.user?.name || session?.user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {isClient ? "Client" : "Business"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup/client">
                <Button size="sm" className="text-sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          {isAuthenticated ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 pt-8">
                  {/* User Info */}
                  <div className="px-2 pb-4 border-b">
                    <p className="text-sm font-semibold">{session?.user?.name || session?.user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isClient ? "Client" : "Business"}
                    </p>
                  </div>

                  {/* Navigation Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
                        {link.label}
                      </Button>
                    </Link>
                  ))}

                  {/* Settings */}
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </Button>
                  </Link>

                  {/* Sign Out */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup/client">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
