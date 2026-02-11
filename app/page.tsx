"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle2, Users, BarChart3, Bell, Zap, TrendingUp } from "lucide-react"

export default function Home() {
  // Middleware handles redirects - no session checking needed here
  // This page renders immediately without waiting
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
              Never Miss Another Appointment
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              AI-powered appointment optimization that reduces no-shows, prevents cancellations, and keeps your business booked solid.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup/client">
              <Button size="lg" className="text-base">
                Book Appointments
              </Button>
            </Link>
            <Link href="/signup/business">
              <Button size="lg" variant="outline" className="text-base">
                Grow Your Business
              </Button>
            </Link>
          </div>

          <div className="pt-8 text-sm text-gray-600">
            <p>Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16 pt-16 border-t">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">40%</div>
            <p className="text-sm text-gray-600 mt-2">Reduction in no-shows</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">95%</div>
            <p className="text-sm text-gray-600 mt-2">Booking accuracy</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <p className="text-sm text-gray-600 mt-2">AI monitoring</p>
          </div>
        </div>
      </section>

      {/* Features for Clients */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">For Clients</h2>
            <p className="text-lg text-gray-600">Simple, reliable booking experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Browse services, check availability, and book appointments with just a few clicks.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <Bell className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Smart Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Get timely notifications and confirmations so you never miss your appointments.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Build a reliable reputation and get perks from your favorite businesses.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup/client">
              <Button size="lg" variant="outline">
                Sign Up as Client
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features for Businesses */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">For Businesses</h2>
            <p className="text-lg text-gray-600">Maximize revenue and minimize losses</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">AI Risk Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Predict no-shows and cancellations before they happen with advanced AI algorithms.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Track no-show rates, client profiles, and revenue impact in one dashboard.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Smart Confirmations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Automated pre-appointment polls and instant notifications to reduce no-shows.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Reduce No-Shows</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">AI-powered client risk assessment</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Automated confirmation reminders</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Last-minute slot optimization</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Maximize Revenue</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Fill slots with discounted offers</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Waitlist management</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Detailed revenue analytics</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup/business">
              <Button size="lg" variant="outline">
                Sign Up as Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Ready to Transform Your Appointments?</h2>
          <p className="text-lg text-gray-600">Join hundreds of businesses and thousands of clients using Appointment Optimizer.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup/client">
              <Button size="lg" className="text-base">
                Get Started as Client
              </Button>
            </Link>
            <Link href="/signup/business">
              <Button size="lg" variant="outline" className="text-base">
                Get Started as Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2026 Appointment Optimizer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
