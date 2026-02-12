import AppointmentConfirmed from "@/components/appointment-confirm";
import { Suspense } from "react";

export default function AppointmentConfirmedPage() {

  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
        <AppointmentConfirmed />
    </Suspense>
  )
}
