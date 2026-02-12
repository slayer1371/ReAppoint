"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface WaitlistEntry {
  id: string;
  position: number;
  status: string;
  offerExpiresAt: string | null;
  businessId: string;
  serviceId: string;
  business: {
    businessName: string;
  };
  service: {
    name: string;
    basePrice: number;
    durationMins: number;
  };
}

export default function WaitlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchWaitlist = async () => {
      try {
        const res = await fetch("/api/waitlist");
        if (!res.ok) {
          setError("Failed to fetch waitlist");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setWaitlist(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching waitlist:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchWaitlist();
  }, [session]);

  const handleLeaveWaitlist = async (id: string) => {
    if (!confirm("Are you sure you want to leave this waitlist?")) return;

    try {
      const res = await fetch(`/api/waitlist/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to leave waitlist");
        return;
      }
      setWaitlist(waitlist.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error("Error:", err);
      alert("Error leaving waitlist");
    }
  };

  const handleAcceptOffer = async (id: string) => {
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "accept" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to accept offer");
        return;
      }

      const data = await res.json();
      
      // Redirect to booking page with necessary parameters
      if (data.data?.bookingUrl) {
        router.push(data.data.bookingUrl);
      } else {
        alert("Error: No booking URL returned");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error accepting offer");
    }
  };

  const handleDeclineOffer = async (id: string) => {
    if (!confirm("Decline this offer? It will go to the next person in line."))
      return;

    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "decline" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to decline offer");
        return;
      }

      // Remove from local state since it's been deleted from database
      setWaitlist(waitlist.filter((w) => w.id !== id));
      alert("Offer declined and moved to next person in queue");
    } catch (err) {
      console.error("Error:", err);
      alert("Error declining offer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading waitlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Waitlist</h1>
          <p className="text-gray-600 mt-2">
            View and manage your waitlist entries
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Empty State */}
        {waitlist.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">You&apos;re not on any waitlists yet.</p>
            <Button onClick={() => router.push("/appointments/create-appointment")}>
              Browse Services
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {waitlist.map((entry) => (
              <Card key={entry.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {entry.business.businessName}
                    </h2>
                    <p className="text-gray-600">{entry.service.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${
                        entry.status === "waiting"
                          ? "bg-blue-100 text-blue-800"
                          : entry.status === "offered"
                          ? "bg-green-100 text-green-800"
                          : entry.status === "accepted"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Position in Queue</p>
                    <p className="text-2xl font-bold text-gray-900">#{entry.position}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-lg text-gray-900">
                      {entry.service.durationMins} mins
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${entry.service.basePrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Offer Details */}
                {entry.status === "offered" && entry.offerExpiresAt && (
                  <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      🎉 Great news! A slot is available for you!
                    </p>
                    <p className="text-xs text-green-700">
                      Offer expires: {new Date(entry.offerExpiresAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {entry.status === "offered" ? (
                    <>
                      <Button
                        onClick={() => handleAcceptOffer(entry.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accept Offer
                      </Button>
                      <Button
                        onClick={() => handleDeclineOffer(entry.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleLeaveWaitlist(entry.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Leave Waitlist
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
